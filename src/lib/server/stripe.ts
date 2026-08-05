import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
	if (!stripeInstance) {
		const key = STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
		if (!key || key.includes('placeholder')) {
			console.warn('[Stripe SDK Warning] STRIPE_SECRET_KEY is missing or using placeholder.');
		}
		stripeInstance = new Stripe(key, {
			apiVersion: '2025-02-24.acacia' as any
		});
	}
	return stripeInstance;
}

export interface CreatePaymentIntentParams {
	amountInCents: number; // e.g. 5000 for $50.00
	currency?: string;
	customerEmail: string;
	customerName?: string;
	metadata: Record<string, string>;
}

export async function createStripePaymentIntent({
	amountInCents,
	currency = 'usd',
	customerEmail,
	customerName,
	metadata
}: CreatePaymentIntentParams): Promise<{ clientSecret: string; paymentIntentId: string }> {
	const stripe = getStripeClient();

	// Check if keys are placeholders for dev mode fallback
	const key = STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
	if (!key || key.includes('placeholder')) {
		console.log('[Stripe Dev Fallback] Returning mock PaymentIntent clientSecret.');
		const mockId = `pi_mock_${Math.random().toString(36).substring(2, 12)}`;
		return {
			clientSecret: `${mockId}_secret_${Math.random().toString(36).substring(2, 12)}`,
			paymentIntentId: mockId
		};
	}

	// 1. Search for existing Stripe customer by email or create new customer
	let customerId: string | undefined;
	try {
		const existingCustomers = await stripe.customers.list({
			email: customerEmail,
			limit: 1
		});
		if (existingCustomers.data.length > 0) {
			customerId = existingCustomers.data[0].id;
		} else {
			const newCustomer = await stripe.customers.create({
				email: customerEmail,
				name: customerName,
				metadata: { source: 'SplitACharter' }
			});
			customerId = newCustomer.id;
		}
	} catch (err) {
		console.warn('Stripe customer lookup/creation error:', err);
	}

	// 2. Create PaymentIntent
	const paymentIntent = await stripe.paymentIntents.create({
		amount: amountInCents,
		currency: currency.toLowerCase(),
		customer: customerId,
		automatic_payment_methods: { enabled: true },
		metadata
	});

	if (!paymentIntent.client_secret) {
		throw new Error('Failed to retrieve client_secret from Stripe PaymentIntent');
	}

	return {
		clientSecret: paymentIntent.client_secret,
		paymentIntentId: paymentIntent.id
	};
}

export interface RefundParams {
	paymentIntentId: string;
	amountInCents?: number; // Optional partial refund, default is full refund
	reason?: 'requested_by_customer' | 'duplicate' | 'fraudulent';
}

export async function refundStripePaymentIntent({
	paymentIntentId,
	amountInCents,
	reason = 'requested_by_customer'
}: RefundParams): Promise<{ refundId: string; status: string }> {
	const stripe = getStripeClient();

	const key = STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
	if (!key || key.includes('placeholder') || paymentIntentId.startsWith('pi_mock_')) {
		console.log(`[Stripe Dev Fallback] Mock refund processed for intent: ${paymentIntentId}`);
		return {
			refundId: `re_mock_${Math.random().toString(36).substring(2, 12)}`,
			status: 'succeeded'
		};
	}

	const refund = await stripe.refunds.create({
		payment_intent: paymentIntentId,
		amount: amountInCents,
		reason
	});

	return {
		refundId: refund.id,
		status: refund.status || 'succeeded'
	};
}

export function verifyStripeWebhook(body: string | Buffer, signature: string): Stripe.Event {
	const stripe = getStripeClient();
	const secret = STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
	if (!secret || secret.includes('placeholder')) {
		// Fallback for dev mode when webhook signature checking isn't set up
		return JSON.parse(typeof body === 'string' ? body : body.toString());
	}
	return stripe.webhooks.constructEvent(body, signature, secret);
}

export async function getStripeAccountDetails() {
	const stripe = getStripeClient();
	const key = STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
	if (!key || key.includes('placeholder')) {
		return {
			connected: false,
			isMock: true,
			message: 'STRIPE_SECRET_KEY is using placeholder. Using mock fallback.'
		};
	}

	try {
		const account = await (stripe.accounts.retrieve as any)();
		return {
			connected: true,
			isMock: false,
			accountId: account.id,
			businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || 'Connected Account',
			country: account.country,
			chargesEnabled: account.charges_enabled,
			payoutsEnabled: account.payouts_enabled,
			isLive: key.startsWith('sk_live_')
		};
	} catch (err: any) {
		return {
			connected: false,
			isMock: false,
			error: err.message || 'Failed to connect to Stripe API'
		};
	}
}
