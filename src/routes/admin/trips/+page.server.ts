import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sendNotification } from '$lib/notifications';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [tripsRes, listingsRes] = await Promise.all([
		supabase
			.from('trip_instances')
			.select(`
				id,
				date,
				status,
				captain_id,
				captains (
					name,
					phone
				),
				listing_templates (
					id,
					trip_type,
					location,
					meeting_area
				),
				bookings (
					id,
					group_size,
					status,
					created_at,
					customers (
						id,
						name,
						email,
						phone
					)
				)
			`)
			.order('date', { ascending: false }),
		supabase
			.from('listing_templates')
			.select('id, trip_type, location')
			.eq('active', true)
			.order('trip_type', { ascending: true })
	]);

	if (tripsRes.error) {
		console.error('Error loading trips for admin:', tripsRes.error);
		throw error(500, 'Failed to load trip instances');
	}

	return {
		trips: tripsRes.data || [],
		listingTemplates: listingsRes.data || []
	};
};

export const actions: Actions = {
	getLogs: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const phone = formData.get('phone') as string;

		if (!email && !phone) {
			return fail(400, { message: 'Missing recipient identifier' });
		}

		let filterStr = '';
		if (email && phone) {
			filterStr = `recipient.eq.${email},recipient.eq.${phone}`;
		} else if (email) {
			filterStr = `recipient.eq.${email}`;
		} else if (phone) {
			filterStr = `recipient.eq.${phone}`;
		}

		const { data: logs, error: logsErr } = await supabase
			.from('notification_logs')
			.select('*')
			.or(filterStr)
			.order('timestamp', { ascending: false });

		if (logsErr) {
			console.error('Error fetching logs:', logsErr);
			return fail(500, { message: 'Failed to fetch logs' });
		}

		// Filter out login/auth communications and only return trip-related communications
		const tripLogs = (logs || []).filter((l: any) => {
			const template = (l.template || '').toLowerCase();
			const isLoginOrAuth =
				template.includes('auth') ||
				template.includes('login') ||
				template.includes('magic') ||
				template.includes('otp');
			return !isLoginOrAuth;
		});

		return { logs: tripLogs };
	},

	cancelTrip: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const tripId = formData.get('tripId') as string;
		const withRefund = formData.get('withRefund') === 'true';
		const reason = (formData.get('reason') as string)?.trim() || 'Operations cancellation';

		if (!tripId) {
			return fail(400, { message: 'Trip ID is required.' });
		}

		// Update trip instance status to canceled
		const { error: cancelErr } = await supabase
			.from('trip_instances')
			.update({ status: 'canceled' })
			.eq('id', tripId);

		if (cancelErr) {
			console.error('Error canceling trip:', cancelErr);
			return fail(500, { message: cancelErr.message || 'Failed to cancel trip instance.' });
		}

		// Retrieve active bookings on this trip to cancel, optionally refund, and notify customers
		const { data: bookings } = await supabase
			.from('bookings')
			.select('id, customers(name, phone, email), trip_instances(date, listing_templates(trip_type))')
			.eq('trip_instance_id', tripId)
			.not('status', 'in', '("canceled","forfeited")');

		if (bookings && bookings.length > 0) {
			for (const b of bookings) {
				await supabase
					.from('bookings')
					.update({ status: 'canceled' })
					.eq('id', b.id);

				if (withRefund) {
					const refundId = `ref_admin_${Math.random().toString(36).substring(2, 10)}`;
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
	}
};
