import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY } from '$env/static/private';
import { sendSMS } from './sms';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Compiles a template string by replacing placeholder patterns like {key}
 * with the corresponding string value from the data map.
 */
export function compileTemplate(template: string, data: Record<string, string>): string {
	let compiled = template;
	for (const [key, value] of Object.entries(data)) {
		const regex = new RegExp(`{${key}}`, 'g');
		compiled = compiled.replace(regex, value || '');
	}
	return compiled;
}

/**
 * Sends a transactional email via Resend's REST API. If the API key is a placeholder,
 * logs a mock email to the console. Logs results to public.notification_logs.
 */
export async function sendEmail(
	to: string,
	subject: string,
	htmlContent: string,
	triggerName: string
): Promise<{ success: boolean; id?: string; error?: string }> {
	const apiKey = RESEND_API_KEY;
	const isMock = !apiKey || apiKey.includes('placeholder') || apiKey.includes('your-resend-api-key');

	let success = false;
	let id: string | undefined;
	let error: string | undefined;

	if (isMock) {
		success = true;
		id = `mock_email_${Math.random().toString(36).substring(2, 10)}`;
		console.log(`[MOCK EMAIL] To: ${to} | Subject: "${subject}" | Content:\n${htmlContent}`);
	} else {
		try {
			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					from: 'SplitACharter <onboarding@resend.dev>', // Resend Sandbox Sender
					to,
					subject,
					html: htmlContent.replace(/\n/g, '<br />')
				})
			});

			const responseData = await response.json();

			if (response.ok) {
				success = true;
				id = responseData.id;
				console.log(`[Resend Email Success] Email ID:`, id);
			} else {
				error = responseData.message || 'Failed to send Resend email';
				console.error(`[Resend Email Error] Status ${response.status}:`, responseData);
			}
		} catch (err: any) {
			error = err.message || 'Resend connection error';
			console.error(`[Resend Email Exception]:`, err);
		}
	}

	// Audit log insertion
	try {
		await supabaseAdmin.from('notification_logs').insert({
			recipient: to,
			channel: 'email',
			template: triggerName,
			content: htmlContent,
			status: success ? 'delivered' : `failed: ${error || 'unknown'}`
		});
	} catch (dbErr) {
		console.error('Failed to log notification status to DB:', dbErr);
	}

	return { success, id, error };
}

/**
 * Unified notification dispatch engine. Checks admin preferences in the database,
 * compiles dynamic message templates, and sends emails/SMS while logging results.
 */
export async function sendNotification(
	trigger: string,
	recipient: { email?: string; phone?: string; name?: string },
	data: Record<string, string>
): Promise<{ emailSent: boolean; smsSent: boolean }> {
	const defaultBaseUrl = 'http://localhost:5173';
	const fullData = {
		customer_name: recipient.name || 'Valued Customer',
		dashboard_url: `${defaultBaseUrl}/dashboard`,
		...data
	};

	let emailSent = false;
	let smsSent = false;

	try {
		// 1. Fetch triggers settings from the database
		const { data: setting, error: settingsErr } = await supabaseAdmin
			.from('admin_notification_settings')
			.select('*')
			.eq('trigger_name', trigger)
			.maybeSingle();

		if (settingsErr) {
			console.error(`Failed to load notification settings for trigger ${trigger}:`, settingsErr);
			return { emailSent, smsSent };
		}

		if (!setting) {
			console.warn(`No notification template settings found for trigger: ${trigger}`);
			return { emailSent, smsSent };
		}

		// 2. Process Email Channel
		if (recipient.email && setting.email_template) {
			if (setting.email_enabled) {
				const subject = `SplitACharter Alert: ${trigger.replace(/_/g, ' ').toUpperCase()}`;
				const body = compileTemplate(setting.email_template, fullData);
				const res = await sendEmail(recipient.email, subject, body, trigger);
				emailSent = res.success;
			} else {
				// Log suppressed status for audits
				await supabaseAdmin.from('notification_logs').insert({
					recipient: recipient.email,
					channel: 'email',
					template: trigger,
					content: compileTemplate(setting.email_template, fullData),
					status: 'suppressed'
				});
			}
		}

		// 3. Process SMS Channel
		if (recipient.phone && setting.sms_template) {
			if (setting.sms_enabled) {
				const body = compileTemplate(setting.sms_template, fullData);
				const res = await sendSMS(recipient.phone, body, trigger);
				smsSent = res.success;
			} else {
				// Log suppressed status for audits
				await supabaseAdmin.from('notification_logs').insert({
					recipient: recipient.phone,
					channel: 'sms',
					template: trigger,
					content: compileTemplate(setting.sms_template, fullData),
					status: 'suppressed'
				});
			}
		}
	} catch (err) {
		console.error(`Error in sendNotification for trigger ${trigger}:`, err);
	}

	return { emailSent, smsSent };
}
