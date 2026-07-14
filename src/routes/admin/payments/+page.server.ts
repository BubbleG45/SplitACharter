import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sendNotification } from '$lib/notifications';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: payments, error: loadErr } = await supabase
		.from('payment_records')
		.select(`
			id,
			stripe_payment_intent_id,
			amount,
			status,
			created_at,
			bookings (
				id,
				group_size,
				status,
				customers (
					name,
					email,
					phone
				),
				trip_instances (
					date,
					listing_templates (
						trip_type
					)
				)
			)
		`)
		.order('created_at', { ascending: false });

	if (loadErr) {
		console.error('Error loading payments ledger for admin:', loadErr);
		throw error(500, 'Failed to load payments ledger');
	}

	return {
		payments: payments || []
	};
};

export const actions: Actions = {
	triggerRefund: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const paymentId = formData.get('paymentId') as string;
		const bookingId = formData.get('bookingId') as string;

		if (!paymentId || !bookingId) {
			return fail(400, { message: 'Missing paymentId or bookingId' });
		}

		// Retrieve original payment details
		const { data: originalPay } = await supabase
			.from('payment_records')
			.select('amount, stripe_payment_intent_id')
			.eq('id', paymentId)
			.single();

		if (!originalPay) {
			return fail(404, { message: 'Original payment record not found.' });
		}

		if (originalPay.amount <= 0) {
			return fail(400, { message: 'Cannot refund a negative or zero transaction.' });
		}

		// Check if already refunded
		const { data: existingRefunds } = await supabase
			.from('payment_records')
			.select('amount')
			.eq('booking_id', bookingId)
			.eq('status', 'refunded');

		const totalRefunded = existingRefunds?.reduce((sum, r) => sum + r.amount, 0) || 0;
		if (Math.abs(totalRefunded) >= originalPay.amount) {
			return fail(400, { message: 'This transaction has already been fully refunded.' });
		}

		// 1. Cancel the booking
		const { error: bookingCancelErr } = await supabase
			.from('bookings')
			.update({ status: 'canceled' })
			.eq('id', bookingId);

		if (bookingCancelErr) {
			console.error('Failed to cancel booking for refund:', bookingCancelErr);
			return fail(500, { message: 'Failed to cancel booking state.' });
		}

		// 2. Insert simulated Stripe refund payment record
		const refundIntentId = `re_manual_${Math.random().toString(36).substring(2, 12)}`;
		const { error: refundErr } = await supabase
			.from('payment_records')
			.insert({
				booking_id: bookingId,
				stripe_payment_intent_id: refundIntentId,
				amount: originalPay.amount, // Positive amount to satisfy DB constraints
				status: 'refunded'
			});

		if (refundErr) {
			console.error('Failed to insert refund record:', refundErr);
			return fail(500, { message: 'Failed to record refund transaction.' });
		}

		// 3. Send notification to customer
		const { data: bookingDetails } = await supabase
			.from('bookings')
			.select('customers(name, email, phone), trip_instances(date, listing_templates(trip_type))')
			.eq('id', bookingId)
			.single();

		const customer = (bookingDetails as any)?.customers;
		const trip = (bookingDetails as any)?.trip_instances;
		const tripDetails = trip?.listing_templates;

		if (customer) {
			await sendNotification(
				'matching_timeout', // Reuses the refund notification template
				{ email: customer.email, phone: customer.phone, name: customer.name },
				{
					trip_date: trip?.date || '',
					trip_type: tripDetails?.trip_type || ''
				}
			);
		}

		return { success: true };
	}
};
