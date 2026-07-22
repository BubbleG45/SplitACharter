import { error, fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { inngest } from '$lib/inngest/client';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/login?next=/dashboard');
	}

	// Fetch customer profile
	const { data: profile } = await supabase
		.from('customers')
		.select('*')
		.eq('id', user.id)
		.maybeSingle();

	// Fetch customer's bookings, joined with TripInstance and ListingTemplate
	const { data: bookings, error: bookingsError } = await supabase
		.from('bookings')
		.select(`
			id,
			group_size,
			status,
			reconfirmation_timestamp,
			created_at,
			trip_instances (
				id,
				date,
				status,
				listing_templates (
					id,
					trip_type,
					location,
					meeting_area
				)
			)
		`)
		.eq('customer_id', user.id)
		.order('created_at', { ascending: false });

	if (bookingsError) {
		console.error('Error fetching dashboard bookings:', bookingsError);
	}

	return {
		profile,
		bookings: bookings || []
	};
};

export const actions: Actions = {
	reconfirm: async ({ request, locals: { safeGetSession } }) => {
		const { session, user } = await safeGetSession();

		if (!session || !user) {
			return fail(401, { message: 'Unauthorized. Please sign in.' });
		}

		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;

		if (!bookingId) {
			return fail(400, { message: 'Booking ID is required.' });
		}

		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// 1. Fetch booking to verify ownership and current state
		const { data: booking, error: fetchErr } = await supabaseAdmin
			.from('bookings')
			.select('id, customer_id, trip_instance_id, status')
			.eq('id', bookingId)
			.single();

		if (fetchErr || !booking) {
			return fail(404, { message: 'Booking not found.' });
		}

		if (booking.customer_id !== user.id) {
			return fail(403, { message: 'Forbidden. You do not own this booking.' });
		}

		if (booking.status !== 'awaiting-reconfirm' && booking.status !== 'paid') {
			return fail(400, { message: `Booking cannot be reconfirmed in its current state: ${booking.status}` });
		}

		// 2. Update booking status to 'reconfirmed'
		const { error: updateErr } = await supabaseAdmin
			.from('bookings')
			.update({
				status: 'reconfirmed',
				reconfirmation_timestamp: new Date().toISOString()
			})
			.eq('id', bookingId);

		if (updateErr) {
			console.error('Error reconfirming booking:', updateErr);
			return fail(500, { message: 'Failed to reconfirm booking.' });
		}

		// 3. Send event to Inngest to cancel the reconfirmation workflow run early
		await inngest.send({
			name: 'booking/reconfirmed',
			data: { bookingId }
		});

		// 4. Check if BOTH bookings on this trip instance are now reconfirmed
		const { data: siblingBookings } = await supabaseAdmin
			.from('bookings')
			.select('id, status')
			.eq('trip_instance_id', booking.trip_instance_id)
			.not('status', 'in', '("canceled","forfeited")');

		const allReconfirmed = siblingBookings?.every(b => b.status === 'reconfirmed') && siblingBookings?.length === 2;

		if (allReconfirmed) {
			// Update TripInstance status to 'confirmed'
			await supabaseAdmin
				.from('trip_instances')
				.update({ status: 'confirmed' })
				.eq('id', booking.trip_instance_id);

			// Retrieve TripInstance details to duplicate it
			const { data: currentTrip } = await supabaseAdmin
				.from('trip_instances')
				.select('listing_template_id, date')
				.eq('id', booking.trip_instance_id)
				.single();

			if (currentTrip) {
				// Spawn a fresh, duplicate 'open' TripInstance on the same date/type/location
				await supabaseAdmin
					.from('trip_instances')
					.insert({
						listing_template_id: currentTrip.listing_template_id,
						date: currentTrip.date,
						status: 'open'
					});
			}

			// Send trip/confirmed event to Inngest to trigger captain matching sequence (Phase 4)
			await inngest.send({
				name: 'trip/confirmed',
				data: { tripInstanceId: booking.trip_instance_id }
			});
		}

		return { success: true };
	},
	cancelBooking: async ({ request, locals: { safeGetSession } }) => {
		const { session, user } = await safeGetSession();

		if (!session || !user) {
			return fail(401, { message: 'Unauthorized. Please sign in.' });
		}

		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;

		if (!bookingId) {
			return fail(400, { message: 'Booking ID is required.' });
		}

		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Fetch booking details to check ownership and state
		const { data: booking, error: fetchErr } = await supabaseAdmin
			.from('bookings')
			.select('id, customer_id, trip_instance_id, status')
			.eq('id', bookingId)
			.single();

		if (fetchErr || !booking) {
			return fail(404, { message: 'Booking not found.' });
		}

		if (booking.customer_id !== user.id) {
			return fail(403, { message: 'Forbidden. You do not own this booking.' });
		}

		if (['canceled', 'forfeited', 'completed'].includes(booking.status)) {
			return fail(400, { message: `Booking cannot be canceled in its current status: ${booking.status}` });
		}

		const isReconfirmed = booking.status === 'reconfirmed';

		// Update booking status to 'canceled'
		const { error: cancelErr } = await supabaseAdmin
			.from('bookings')
			.update({ status: 'canceled' })
			.eq('id', bookingId);

		if (cancelErr) {
			console.error('Error canceling booking:', cancelErr);
			return fail(500, { message: 'Failed to cancel booking.' });
		}

		// Process automatic refund if canceled BEFORE reconfirming
		if (!isReconfirmed) {
			const { data: payRecord } = await supabaseAdmin
				.from('payment_records')
				.select('id, stripe_payment_intent_id, amount')
				.eq('booking_id', bookingId)
				.eq('status', 'succeeded')
				.maybeSingle();

			if (payRecord) {
				await supabaseAdmin
					.from('payment_records')
					.insert({
						booking_id: bookingId,
						stripe_payment_intent_id: `ref_${payRecord.stripe_payment_intent_id}_${Math.random().toString(36).substring(2, 8)}`,
						amount: payRecord.amount,
						status: 'refunded'
					});
			}
		}

		// Re-evaluate remaining active bookings on the trip instance
		const { data: remainingBookings } = await supabaseAdmin
			.from('bookings')
			.select('id, status')
			.eq('trip_instance_id', booking.trip_instance_id)
			.not('status', 'in', '("canceled","forfeited")');

		const activeCount = remainingBookings?.length || 0;
		let newTripStatus = 'open';
		if (activeCount === 1) {
			newTripStatus = 'half-booked';
		} else if (activeCount === 2) {
			const bothReconfirmed = remainingBookings?.every((b) => b.status === 'reconfirmed');
			newTripStatus = bothReconfirmed ? 'confirmed' : 'pending-reconfirm';
		}

		await supabaseAdmin
			.from('trip_instances')
			.update({ status: newTripStatus })
			.eq('id', booking.trip_instance_id);

		return {
			success: true,
			wasRefunded: !isReconfirmed,
			message: !isReconfirmed
				? 'Your booking has been canceled and your $50 reservation deposit has been fully refunded.'
				: 'Your booking has been canceled. Per our policy, fees for reconfirmed trips are non-refundable.'
		};
	}
};
