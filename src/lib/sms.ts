import { PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, PLIVO_SOURCE_NUMBER } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Sends an SMS message via Plivo API. If Plivo credentials are placeholders,
 * falls back to logging mock messages in the console. Logs notification status
 * into public.notification_logs for admin audit.
 */
export async function sendSMS(
	to: string,
	text: string,
	templateName = 'plivo-sms'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const authId = PLIVO_AUTH_ID;
	const authToken = PLIVO_AUTH_TOKEN;
	const sourceNumber = PLIVO_SOURCE_NUMBER;

	const isMock =
		!authId ||
		!authToken ||
		!sourceNumber ||
		authId.includes('placeholder') ||
		authId.includes('your_plivo_auth_id') ||
		authToken.includes('placeholder') ||
		authToken.includes('your_plivo_auth_token') ||
		sourceNumber.includes('your_plivo_phone_number');

	let success = false;
	let messageId: string | undefined;
	let error: string | undefined;

	if (isMock) {
		success = true;
		messageId = `mock_msg_${Math.random().toString(36).substring(2, 10)}`;
		console.log(`[MOCK SMS] To: ${to} | From: ${sourceNumber || 'MOCK'} | Text: ${text}`);
	} else {
		try {
			// btoa handles ASCII authorization strings
			const credentials = btoa(`${authId}:${authToken}`);
			const response = await fetch(`https://api.plivo.com/v1/Account/${authId}/Message/`, {
				method: 'POST',
				headers: {
					'Authorization': `Basic ${credentials}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					src: sourceNumber,
					dst: to,
					text: text
				})
			});

			const responseData = await response.json();

			if (response.ok) {
				success = true;
				messageId = responseData.message_uuid?.[0];
				console.log(`[Plivo SMS Success] Message UUID:`, messageId);
			} else {
				error = responseData.error || 'Failed to send Plivo SMS';
				console.error(`[Plivo SMS Error] Status ${response.status}:`, responseData);
			}
		} catch (err: any) {
			error = err.message || 'Internal connection error';
			console.error(`[Plivo SMS Exception]:`, err);
		}
	}

	// Auditing notification log into database
	try {
		await supabaseAdmin.from('notification_logs').insert({
			recipient: to,
			channel: 'sms',
			template: templateName,
			content: text,
			status: success ? 'delivered' : `failed: ${error || 'unknown'}`
		});
	} catch (dbErr) {
		console.error('Failed to log notification status to DB:', dbErr);
	}

	return { success, messageId, error };
}
