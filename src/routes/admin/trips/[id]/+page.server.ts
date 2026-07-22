import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { inngest } from '$lib/inngest/client';
import { sendNotification } from '$lib/notifications';
import { generateCaptainToken } from '$lib/security';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	// Fetch the Trip Instance details
	const { data: trip, error: tripErr } = await supabase
		.from('trip_instances')
		.select(`
			id,
			date,
			status,
			captain_id,
			notes,
			listing_templates (
				trip_type,
				location,
				meeting_area
			)
		`)
		.eq('id', params.id)
		.maybeSingle();

	if (tripErr || !trip) {
		console.error('Error loading trip instance:', tripErr);
		throw error(404, 'Trip Instance not found');
	}

	// Fetch active bookings on this Trip Instance
	const { data: bookings, error: bookingsErr } = await supabase
		.from('bookings')
		.select(`
			id,
			group_size,
			status,
			customers (
				name,
				email,
				phone
			)
		`)
		.eq('trip_instance_id', params.id)
		.not('status', 'in', '("canceled","forfeited")');

	// Fetch all active captains for manual assignment choice
	const { data: captains } = await supabase
		.from('captains')
		.select('id, name')
		.eq('active', true)
		.order('name', { ascending: true });

	// Fetch notification logs associated with this trip instance (filtered by trip ID in SMS/email content)
	const { data: logs } = await supabase
		.from('notification_logs')
		.select('id, recipient, channel, template, content, status, created_at')
		.ilike('content', `%${params.id}%`)
		.order('created_at', { ascending: false });

	return {
		trip,
		bookings: bookings || [],
		captains: captains || [],
		logs: logs || []
	};
};

export const actions: Actions = {
	manualAssignCaptain: async ({ params, request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const captainId = formData.get('captainId') as string;

		if (!captainId) {
			return fail(400, { message: 'Please select a captain.' });
		}

		// Update the trip instance with assigned captain
		const { data: updatedTrip, error: updateErr } = await supabase
			.from('trip_instances')
			.update({ captain_id: captainId })
			.eq('id', params.id)
			.select('id, date, listing_templates(trip_type, meeting_area)')
			.single();

		if (updateErr) {
			console.error('Error manually assigning captain:', updateErr);
			return fail(500, { message: 'Failed to assign captain.' });
		}

		// Fetch captain details
		const { data: captain } = await supabase
			.from('captains')
			.select('name, phone')
			.eq('id', captainId)
			.single();

		// Fetch bookings
		const { data: bookings } = await supabase
			.from('bookings')
			.select('id, group_size, customers(name, phone, email)')
			.eq('trip_instance_id', params.id)
			.not('status', 'in', '("canceled","forfeited")');

		// Fire cancel event to matching workflow timers in Inngest
		await inngest.send({
			name: 'trip/captain.matched',
			data: { tripInstanceId: params.id }
		});

		const tripDetails = (updatedTrip as any).listing_templates;
		const captainName = captain?.name || 'Assigned Captain';
		const captainPhone = captain?.phone || 'N/A';

		// Trigger notification to the winning Captain with the secure details link
		if (captain?.phone) {
			const detailsToken = generateCaptainToken(params.id, captainId);
			const detailsUrl = `${url.origin}/captain-match/trip-details?tripId=${params.id}&captainId=${captainId}&token=${detailsToken}`;

			await sendNotification(
				'captain_details_link',
				{ phone: captain.phone, name: captain.name },
				{
					trip_date: updatedTrip.date,
					trip_type: tripDetails?.trip_type || '',
					location: tripDetails?.location || '',
					details_url: detailsUrl
				}
			);
		}

		// Trigger notifications to customers
		if (bookings && bookings.length > 0) {
			for (const b of bookings) {
				const customer = (b as any).customers;
				if (customer) {
					await sendNotification(
						'captain_confirmed',
						{ email: customer.email, phone: customer.phone, name: customer.name },
						{
							captain_name: captainName,
							captain_phone: captainPhone,
							meeting_area: tripDetails?.meeting_area || '',
							trip_date: updatedTrip.date,
							trip_type: tripDetails?.trip_type || ''
						}
					);
				}
			}
		}

		return { success: true };
	},

	cancelTrip: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();
		const withRefund = formData.get('withRefund') !== 'false';
		const reason = (formData.get('reason') as string)?.trim() || 'Operations cancellation';

		// Update trip instance status to canceled
		const { error: cancelErr } = await supabase
			.from('trip_instances')
			.update({ status: 'canceled' })
			.eq('id', params.id);

		if (cancelErr) {
			console.error('Error canceling trip:', cancelErr);
			return fail(500, { message: 'Failed to cancel trip instance.' });
		}

		// Retrieve active bookings on this trip to cancel and process refund if requested
		const { data: bookings } = await supabase
			.from('bookings')
			.select('id, customers(name, phone, email), trip_instances(date, listing_templates(trip_type))')
			.eq('trip_instance_id', params.id)
			.not('status', 'in', '("canceled","forfeited")');

		if (bookings && bookings.length > 0) {
			for (const b of bookings) {
				await supabase
					.from('bookings')
					.update({ status: 'canceled' })
					.eq('id', b.id);

				if (withRefund) {
					const refundId = `ref_admin_${Math.random().toString(36).substring(2, 12)}`;
					await supabase
						.from('payment_records')
						.insert({
							booking_id: b.id,
							stripe_payment_intent_id: refundId,
							amount: 50.00,
							status: 'refunded'
						});
				}

				const customer = (b as any).customers;
				const trip = (b as any).trip_instances;
				const tripDetails = trip?.listing_templates;

				if (customer) {
					const refundText = withRefund
						? 'Your $50.00 reservation fee has been fully refunded to your original payment method.'
						: 'Per platform policy, this cancellation is non-refundable.';

					try {
						await sendNotification(
							'admin_trip_cancellation',
							{ email: customer.email, phone: customer.phone, name: customer.name },
							{
								trip_date: trip?.date || '',
								trip_type: tripDetails?.trip_type || '',
								cancellation_reason: reason,
								refund_status_text: refundText
							}
						);
					} catch (notifErr) {
						console.error('Error sending admin_trip_cancellation notification:', notifErr);
					}
				}
			}
		}

		return { success: true };
	},

	saveNotes: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();
		const notes = formData.get('notes') as string;

		const { error: notesErr } = await supabase
			.from('trip_instances')
			.update({ notes: notes || null })
			.eq('id', params.id);

		if (notesErr) {
			console.error('Error saving notes:', notesErr);
			return fail(500, { message: 'Failed to save notes.' });
		}

		return { success: true };
	}
};
