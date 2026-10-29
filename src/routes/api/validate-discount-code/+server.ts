import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { normalizePromoCode, calculateDiscount } from '$lib/promo_codes';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return json({ valid: false, status: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	const rawCode = url.searchParams.get('code');
	const code = normalizePromoCode(rawCode);

	if (!code) {
		return json({ valid: false, status: 'empty', message: 'No promo code provided.' });
	}

	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	const { data: promo, error: promoErr } = await supabaseAdmin
		.from('promo_codes')
		.select('*')
		.ilike('code', code)
		.maybeSingle();

	if (promoErr || !promo) {
		return json({
			valid: false,
			status: 'invalid',
			message: `Promo code '${code}' is invalid or does not exist.`
		});
	}

	if (!promo.active) {
		return json({
			valid: false,
			status: 'inactive',
			message: `Promo code '${promo.code}' is currently inactive.`
		});
	}

	const baseAmount = 50.00;
	const { discountAmount, finalAmount } = calculateDiscount(baseAmount, promo.discount_percent);

	return json({
		valid: true,
		status: 'valid',
		code: promo.code,
		slotNumber: promo.slot_number,
		discountPercent: promo.discount_percent,
		originalAmount: baseAmount,
		discountAmount,
		finalAmount,
		isFree: finalAmount === 0,
		message: `${promo.discount_percent}% discount applied! You save $${discountAmount.toFixed(2)}.`
	});
};
