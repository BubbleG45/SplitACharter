import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createStripePaymentIntent } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
	try {
		const { session, user } = await safeGetSession();
		if (!session || !user) {
			return json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
		}

		const body = await request.json();
		const { templateId, date, name, phone, email, groupSize } = body;

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

		const maxAllowed = listing ? Math.min(4, listing.max_passengers) : 4;
		if (size < 1 || size > maxAllowed) {
			return json({ error: `Group size (${size}) exceeds maximum allowed passengers (${maxAllowed}) for this charter.` }, { status: 400 });
		}

		// Create PaymentIntent
		const intentResult = await createStripePaymentIntent({
			amountInCents: 5000,
			customerEmail: emailToUse,
			customerName: nameToUse,
			metadata: {
				user_id: user.id,
				template_id: templateId,
				date,
				group_size: String(size)
			}
		});

		return json({
			success: true,
			clientSecret: intentResult.clientSecret,
			paymentIntentId: intentResult.paymentIntentId
		});
	} catch (err: any) {
		console.error('Error creating Stripe payment intent API:', err);
		return json({ error: err?.message || 'Failed to initialize Stripe PaymentIntent' }, { status: 500 });
	}
};
