import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripeAccountDetails } from '$lib/server/stripe';
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';

export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();

	// Restrict debug endpoint to authenticated user / admin if needed
	const accountInfo = await getStripeAccountDetails();

	return json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		stripe: {
			publishableKeyConfigured: Boolean(
				PUBLIC_STRIPE_PUBLISHABLE_KEY && !PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('placeholder')
			),
			publishableKeyPrefix: PUBLIC_STRIPE_PUBLISHABLE_KEY
				? PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 7) + '...'
				: 'missing',
			account: accountInfo
		}
	});
};
