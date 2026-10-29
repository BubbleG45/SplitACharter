import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createStripePaymentIntent } from '$lib/server/stripe';
import { normalizePromoCode, calculateDiscount } from '$lib/promo_codes';

export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
	try {
		const { session, user } = await safeGetSession();
		if (!session || !user) {
			return json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
		}

		const body = await request.json();
		const { templateId, date, name, phone, email, groupSize, promoCode } = body;

		const emailToUse = (email || user.email || '').trim();
		const nameToUse = (name || 'Customer').trim();
		const size = parseInt(String(groupSize || 1), 10);

		if (!templateId || !date) {
			return json({ error: 'Missing listing template ID or date.' }, { status: 400 });
		}

		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Check for account suspension
		const { data: flaggedMatch } = await supabaseAdmin
			.from('customers')
			.select('id')
			.or(`id.eq.${user.id},email.eq.${emailToUse},phone.eq.${phone || ''}`)
			.or('flagged.eq.true,strike_count.gte.3')
			.limit(1)
			.maybeSingle();

		if (flaggedMatch) {
			return json({ error: 'Booking blocked. Account suspended due to strikes or flagging.' }, { status: 400 });
		}

		// Fetch listing template to validate max passengers
		const { data: listing } = await supabaseAdmin
			.from('listing_templates')
			.select('max_passengers')
			.eq('id', templateId)
			.maybeSingle();

		let maxAllowed = listing ? Math.min(4, Math.max(1, listing.max_passengers - 1)) : 4;
		if (listing) {
			const { data: candidateTrips } = await supabaseAdmin
				.from('trip_instances')
				.select('id')
				.eq('listing_template_id', templateId)
				.eq('date', date)
				.eq('status', 'half-booked');

			if (candidateTrips && candidateTrips.length > 0) {
				const { data: bookings } = await supabaseAdmin
					.from('bookings')
					.select('group_size')
					.eq('trip_instance_id', candidateTrips[0].id)
					.in('status', ['paid', 'reconfirmed']);

				const currentlyBooked = bookings?.reduce((sum, b) => sum + b.group_size, 0) || 0;
				maxAllowed = Math.min(4, Math.max(0, listing.max_passengers - currentlyBooked));
			}
		}

		if (size < 1 || size > maxAllowed) {
			return json({ error: `Group size (${size}) exceeds maximum allowed passengers (${maxAllowed}) for this charter.` }, { status: 400 });
		}

		// Calculate deposit amount, applying discount promo code if provided
		let amountInCents = 5000;
		let appliedPromoCode: string | null = null;
		let discountPercent = 0;
		let discountAmount = 0;

		const normalizedCode = normalizePromoCode(promoCode);
		if (normalizedCode) {
			const { data: promo } = await supabaseAdmin
				.from('promo_codes')
				.select('*')
				.ilike('code', normalizedCode)
				.eq('active', true)
				.maybeSingle();

			if (promo) {
				const calc = calculateDiscount(50.00, promo.discount_percent);
				appliedPromoCode = promo.code;
				discountPercent = promo.discount_percent;
				discountAmount = calc.discountAmount;
				amountInCents = Math.round(calc.finalAmount * 100);
			}
		}

		// If 100% discount is applied, no Stripe PaymentIntent is needed
		if (amountInCents === 0) {
			return json({
				success: true,
				isFree: true,
				clientSecret: null,
				paymentIntentId: 'pi_free',
				amountInCents: 0,
				finalAmount: 0.00,
				discountAmount: 50.00,
				discountPercent: 100,
				promoCode: appliedPromoCode
			});
		}

		// Create Stripe PaymentIntent for amount > $0
		const intentResult = await createStripePaymentIntent({
			amountInCents,
			customerEmail: emailToUse,
			customerName: nameToUse,
			metadata: {
				user_id: user.id,
				template_id: templateId,
				date,
				group_size: String(size),
				promo_code: appliedPromoCode || '',
				discount_percent: String(discountPercent),
				discount_amount: discountAmount.toFixed(2)
			}
		});

		return json({
			success: true,
			isFree: false,
			clientSecret: intentResult.clientSecret,
			paymentIntentId: intentResult.paymentIntentId,
			amountInCents,
			finalAmount: amountInCents / 100,
			discountAmount,
			discountPercent,
			promoCode: appliedPromoCode
		});
	} catch (err: any) {
		console.error('Error creating Stripe payment intent API:', err);
		return json({ error: err?.message || 'Failed to initialize Stripe PaymentIntent' }, { status: 500 });
	}
};
