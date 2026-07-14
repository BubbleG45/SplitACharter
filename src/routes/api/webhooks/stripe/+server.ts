import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	let event: any;
	try {
		event = await request.json();
	} catch (e) {
		return json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	const { type, data } = event;
	if (!type || !data?.object) {
		return json({ error: 'Missing type or data object' }, { status: 400 });
	}

	const paymentIntent = data.object;
	const stripePaymentIntentId = paymentIntent.id;
	const amount = paymentIntent.amount / 100; // Convert cents to dollars
	const bookingId = paymentIntent.metadata?.bookingId;

	if (!stripePaymentIntentId) {
		return json({ error: 'Missing stripe payment intent ID' }, { status: 400 });
	}

	console.log(`[Stripe Webhook Received] Event Type: ${type} | Intent ID: ${stripePaymentIntentId}`);

	// Bypass RLS to check/insert payment records
	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	try {
		// 1. Idempotency Check: Check if this stripe_payment_intent_id has already been processed
		const { data: existingRecord } = await supabaseAdmin
			.from('payment_records')
			.select('id, booking_id, status')
			.eq('stripe_payment_intent_id', stripePaymentIntentId)
			.maybeSingle();

		if (existingRecord) {
			console.log(`[Stripe Webhook Idempotency] Intent ID ${stripePaymentIntentId} already processed. Skipping...`);
			return json({ idempotent: true, processed: false, recordId: existingRecord.id });
		}

		// 2. Process event types
		if (type === 'payment_intent.succeeded') {
			if (!bookingId) {
				return json({ error: 'Missing bookingId in metadata for charge event' }, { status: 400 });
			}

			// Verify booking exists and status
			const { data: booking } = await supabaseAdmin
				.from('bookings')
				.select('id, status')
				.eq('id', bookingId)
				.single();

			if (!booking) {
				return json({ error: 'Referenced booking not found' }, { status: 404 });
			}

			// If booking is not paid, update it
			if (booking.status === 'pending-payment') {
				await supabaseAdmin
					.from('bookings')
					.update({ status: 'paid' })
					.eq('id', bookingId);
			}

			// Register payment record
			const { data: record, error: recordErr } = await supabaseAdmin
				.from('payment_records')
				.insert({
					booking_id: bookingId,
					stripe_payment_intent_id: stripePaymentIntentId,
					amount,
					status: 'succeeded'
				})
				.select('id')
				.single();

			if (recordErr) {
				console.error('Error inserting payment record in webhook:', recordErr);
				return json({ error: 'Failed to record payment transaction' }, { status: 500 });
			}

			console.log(`[Stripe Webhook Success] Processed charge of $${amount} for Booking: ${bookingId}`);
			return json({ success: true, processed: true, recordId: record.id });
		}

		if (type === 'charge.refunded') {
			// Extract bookingId from metadata
			if (!bookingId) {
				return json({ error: 'Missing bookingId in metadata for refund event' }, { status: 400 });
			}

			// Register refund record
			const { data: record, error: recordErr } = await supabaseAdmin
				.from('payment_records')
				.insert({
					booking_id: bookingId,
					stripe_payment_intent_id: stripePaymentIntentId,
					amount, // Positive amount to satisfy DB constraints
					status: 'refunded'
				})
				.select('id')
				.single();

			if (recordErr) {
				console.error('Error inserting refund record in webhook:', recordErr);
				return json({ error: 'Failed to record refund transaction' }, { status: 500 });
			}

			// Update booking status to canceled
			await supabaseAdmin
				.from('bookings')
				.update({ status: 'canceled' })
				.eq('id', bookingId);

			console.log(`[Stripe Webhook Success] Processed refund of $${amount} for Booking: ${bookingId}`);
			return json({ success: true, processed: true, recordId: record.id });
		}

		// Other unhandled stripe webhook event types
		return json({ processed: false, ignored: true });
	} catch (err: any) {
		console.error('Webhook execution failed:', err);
		return json({ error: err.message || 'Internal webhook error' }, { status: 500 });
	}
};
