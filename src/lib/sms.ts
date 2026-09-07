import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Strips accidental enclosing single or double quotes, whitespace, and newlines
 * often copied into environment variable managers like Vercel.
 */
function sanitizeEnv(val?: string): string {
	if (!val) return '';
	return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Formats a phone number into strict E.164 format (+1XXXXXXXXXX for US).
 * Handles raw 10-digit numbers, numbers with hyphens/parentheses/spaces,
 * and numbers missing the leading country code.
 */
export function formatE164(phone: string): string {
	if (!phone) return phone;
	const trimmed = phone.trim();
	if (trimmed.startsWith('+')) return trimmed;
	const digits = trimmed.replace(/\D/g, '');
	if (digits.length === 10) return `+1${digits}`;
	if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
	return `+${digits}`;
}

/**
 * Evaluates the current Twilio configuration state and returns diagnostic details
 * without leaking raw credentials.
 */
export function getTwilioConfigStatus() {
	const accountSid = sanitizeEnv(env.TWILIO_ACCOUNT_SID);
	const apiKeySid = sanitizeEnv(env.TWILIO_API_KEY_SID);
	const apiKeySecret = sanitizeEnv(env.TWILIO_API_KEY_SECRET);
	const authToken = sanitizeEnv(env.TWILIO_AUTH_TOKEN);
	const sourceNumber = sanitizeEnv(env.TWILIO_PHONE_NUMBER || env.TWILIO_MESSAGING_SERVICE_SID);

	let resolvedAccountSid = accountSid;
	if (!resolvedAccountSid.startsWith('AC') && apiKeySid.startsWith('AC')) {
		resolvedAccountSid = apiKeySid;
	}

	let authMode: 'api_key' | 'account_sid' | 'invalid' = 'invalid';
	let authUsername = '';
	if (apiKeySid.startsWith('SK') && apiKeySecret) {
		authMode = 'api_key';
		authUsername = apiKeySid;
	} else if (resolvedAccountSid.startsWith('AC') && (authToken || apiKeySecret)) {
		authMode = 'account_sid';
		authUsername = resolvedAccountSid;
	} else {
		authUsername = apiKeySid || accountSid;
	}

	const isMock =
		!resolvedAccountSid ||
		!authUsername ||
		(!authToken && !apiKeySecret) ||
		!sourceNumber ||
		resolvedAccountSid.includes('placeholder') ||
		resolvedAccountSid.includes('your-twilio-account-sid') ||
		authUsername.includes('placeholder') ||
		sourceNumber.includes('5551234567') ||
		env.MOCK_SMS === '1' ||
		env.MOCK_SMS === 'true';

	return {
		isMock,
		authMode,
		accountSidPrefix: resolvedAccountSid ? resolvedAccountSid.substring(0, 4) + '...' : 'missing',
		accountSidValid: resolvedAccountSid.startsWith('AC'),
		authUsernamePrefix: authUsername ? authUsername.substring(0, 4) + '...' : 'missing',
		authUsernameValid: authUsername.startsWith('AC') || authUsername.startsWith('SK'),
		hasPassword: Boolean(apiKeySecret || authToken),
		sourceNumberType: sourceNumber.startsWith('MG')
			? 'messaging_service'
			: sourceNumber.startsWith('+')
				? 'phone_number'
				: 'unknown',
		sourceNumberMasked: sourceNumber
			? sourceNumber.slice(-4).padStart(sourceNumber.length, '*')
			: 'missing'
	};
}

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
	const accountSid = sanitizeEnv(env.TWILIO_ACCOUNT_SID);
	const apiKeySid = sanitizeEnv(env.TWILIO_API_KEY_SID);
	const apiKeySecret = sanitizeEnv(env.TWILIO_API_KEY_SECRET);
	const authToken = sanitizeEnv(env.TWILIO_AUTH_TOKEN);
	const sourceNumber = sanitizeEnv(env.TWILIO_PHONE_NUMBER || env.TWILIO_MESSAGING_SERVICE_SID);

	// Account SID must start with AC
	let resolvedAccountSid = accountSid;
	if (!resolvedAccountSid.startsWith('AC') && apiKeySid.startsWith('AC')) {
		resolvedAccountSid = apiKeySid;
	}

	// Pair auth credentials properly
	let authUsername = '';
	let authPassword = '';

	if (apiKeySid.startsWith('SK') && apiKeySecret) {
		// API Key authentication (recommended)
		authUsername = apiKeySid;
		authPassword = apiKeySecret;
	} else if (resolvedAccountSid.startsWith('AC') && authToken) {
		// Account SID + Master Auth Token authentication
		authUsername = resolvedAccountSid;
		authPassword = authToken;
	} else if (resolvedAccountSid.startsWith('AC') && apiKeySecret) {
		// Fallback: token was stored in TWILIO_API_KEY_SECRET
		authUsername = resolvedAccountSid;
		authPassword = apiKeySecret;
	} else {
		// Fallback for mock or validation diagnostic reporting
		authUsername = apiKeySid || accountSid;
		authPassword = apiKeySecret || authToken;
	}

	const isMock =
		!resolvedAccountSid ||
		!authUsername ||
		!authPassword ||
		!sourceNumber ||
		resolvedAccountSid.includes('placeholder') ||
		resolvedAccountSid.includes('your-twilio-account-sid') ||
		authUsername.includes('placeholder') ||
		authPassword.includes('placeholder') ||
		sourceNumber.includes('5551234567') ||
		env.MOCK_SMS === '1' ||
		env.MOCK_SMS === 'true';

	let success = false;
	let messageId: string | undefined;
	let error: string | undefined;

	if (isMock) {
		success = true;
		messageId = `mock_msg_${Math.random().toString(36).substring(2, 10)}`;
		console.log(`[MOCK SMS] To: ${to} | From: ${sourceNumber || 'MOCK'} | Text: ${text}`);
	} else {
		// Pre-flight credential validation
		if (!authUsername.startsWith('AC') && !authUsername.startsWith('SK')) {
			const prefix = authUsername ? authUsername.substring(0, 4) : 'empty';
			error = `Twilio configuration error: Auth username must start with "AC" (Account SID) or "SK" (API Key SID), but received "${prefix}...". Please check TWILIO_ACCOUNT_SID or TWILIO_API_KEY_SID in Vercel environment variables.`;
			console.error(`[Twilio SMS Config Error]:`, error);
		} else if (!resolvedAccountSid.startsWith('AC')) {
			const prefix = resolvedAccountSid ? resolvedAccountSid.substring(0, 4) : 'empty';
			error = `Twilio configuration error: TWILIO_ACCOUNT_SID must start with "AC", but received "${prefix}...". Please check TWILIO_ACCOUNT_SID in Vercel environment variables.`;
			console.error(`[Twilio SMS Config Error]:`, error);
		} else {
			try {
				// Twilio Basic Auth: base64(API_KEY_SID:API_SECRET) or base64(ACCOUNT_SID:AUTH_TOKEN)
				const credentials = btoa(`${authUsername}:${authPassword}`);
				const formattedTo = formatE164(to);

				// Support standard Phone Number (+1...) or Messaging Service SID (MG...)
				const payload: Record<string, string> = {
					To: formattedTo,
					Body: text
				};
				if (sourceNumber.startsWith('MG')) {
					payload.MessagingServiceSid = sourceNumber;
				} else {
					payload.From = sourceNumber;
				}

				const formBody = new URLSearchParams(payload).toString();

				const response = await fetch(
					`https://api.twilio.com/2010-04-01/Accounts/${resolvedAccountSid}/Messages.json`,
					{
						method: 'POST',
						headers: {
							Authorization: `Basic ${credentials}`,
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
					if (responseData.code === 20003) {
						error = `Twilio Authentication Error (Code 20003): Invalid credentials. Check that TWILIO_ACCOUNT_SID starts with "AC" and matches TWILIO_AUTH_TOKEN, or TWILIO_API_KEY_SID starts with "SK" and matches TWILIO_API_KEY_SECRET in Vercel.`;
					} else {
						error = responseData.message || `Twilio Error (${responseData.code || response.status})`;
					}
					console.error(`[Twilio SMS Error] Status ${response.status}:`, responseData);
				}
			} catch (err: any) {
				error = err.message || 'Internal connection error';
				console.error(`[Twilio SMS Exception]:`, err);
			}
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
