import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Sends an SMS message via Twilio API using either Twilio API Keys (SK... + Secret)
 * or Twilio Account SID + Auth Token. If credentials are placeholders, falls back
 * to logging mock messages in the console. Logs notification status into
 * public.notification_logs for admin audit.
 */
export async function sendSMS(
	to: string,
	text: string,
	templateName = 'twilio-sms'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const accountSid = env.TWILIO_ACCOUNT_SID;
	// Support API Key SID (SK...) or fallback to Account SID (AC...)
	const authUsername = env.TWILIO_API_KEY_SID || env.TWILIO_ACCOUNT_SID;
	// Support API Key Secret or fallback to Auth Token
	const authPassword = env.TWILIO_API_KEY_SECRET || env.TWILIO_AUTH_TOKEN;
	const sourceNumber = env.TWILIO_PHONE_NUMBER || env.TWILIO_MESSAGING_SERVICE_SID;

	const isMock =
		!accountSid ||
		!authUsername ||
		!authPassword ||
		!sourceNumber ||
		accountSid.includes('placeholder') ||
		accountSid.includes('your-twilio-account-sid') ||
		authUsername.includes('placeholder') ||
		authPassword.includes('placeholder') ||
		sourceNumber.includes('5551234567');

	let success = false;
	let messageId: string | undefined;
	let error: string | undefined;

	if (isMock) {
		success = true;
		messageId = `mock_msg_${Math.random().toString(36).substring(2, 10)}`;
		console.log(`[MOCK SMS] To: ${to} | From: ${sourceNumber || 'MOCK'} | Text: ${text}`);
	} else {
		try {
			// Twilio Basic Auth: base64(API_KEY_SID:API_SECRET) or base64(ACCOUNT_SID:AUTH_TOKEN)
			const credentials = btoa(`${authUsername}:${authPassword}`);
			
			// Support standard Phone Number (+1...) or Messaging Service SID (MG...)
			const payload: Record<string, string> = {
				To: to,
				Body: text
			};
			if (sourceNumber.startsWith('MG')) {
				payload.MessagingServiceSid = sourceNumber;
			} else {
				payload.From = sourceNumber;
			}

			const formBody = new URLSearchParams(payload).toString();

			const response = await fetch(
				`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
				{
					method: 'POST',
					headers: {
						'Authorization': `Basic ${credentials}`,
						'Content-Type': 'application/x-www-form-urlencoded'
					},
					body: formBody
				}
			);

			const responseData = await response.json();

			if (response.ok) {
				success = true;
				messageId = responseData.sid;
				console.log(`[Twilio SMS Success] Message SID:`, messageId);
			} else {
				error = responseData.message || `Twilio Error (${responseData.code || response.status})`;
				console.error(`[Twilio SMS Error] Status ${response.status}:`, responseData);
			}
		} catch (err: any) {
			error = err.message || 'Internal connection error';
			console.error(`[Twilio SMS Exception]:`, err);
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
