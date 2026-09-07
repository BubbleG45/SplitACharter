import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTwilioConfigStatus } from '$lib/sms';

export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();

	const config = getTwilioConfigStatus();

	return json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		twilio: config
	});
};
