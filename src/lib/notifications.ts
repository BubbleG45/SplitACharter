import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { sendSMS } from './sms';

const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL;

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
/**
 * Resolves the primary site URL dynamically based on environment variables (PUBLIC_SITE_URL,
 * VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL) with default fallback to https://splitacharter.boats.
 */
export function getSiteUrl(origin?: string): string {
	let rawUrl =
		env.PUBLIC_SITE_URL ||
		env.VERCEL_PROJECT_PRODUCTION_URL ||
		env.VERCEL_URL ||
		origin ||
		'https://splitacharter.boats';

	rawUrl = rawUrl.trim().replace(/\/+$/, '');
	if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
		rawUrl = `https://${rawUrl}`;
	}
	return rawUrl;
}

/**
 * Wraps dynamic body HTML inside a premium responsive HTML email template
 * styled with the SplitACharter Slate, Cyan, and Indigo theme.
 */
export function wrapInEmailLayout(contentHtml: string, title: string): string {
	const currentYear = new Date().getFullYear();
	const baseUrl = getSiteUrl();
	const logoUrl = `${baseUrl}/logo-white.svg`;

	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			background-color: #060913;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
			color: #f8fafc;
			-webkit-font-smoothing: antialiased;
		}
		.wrapper {
			width: 100%;
			table-layout: fixed;
			background-color: #060913;
			padding: 40px 0;
		}
		.container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #0a0f1d;
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 12px;
			overflow: hidden;
			box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
		}
		.header-bar {
			background: linear-gradient(90deg, #06b6d4 0%, #6366f1 100%);
			height: 4px;
			width: 100%;
		}
		.content {
			padding: 40px;
		}
		.logo-img {
			height: 44px;
			max-height: 44px;
			width: auto;
			display: block;
			border: 0;
		}
		.logo-cyan {
			color: #06b6d4;
		}
		.body-text {
			font-size: 16px;
			line-height: 1.6;
			color: #94a3b8;
		}
		.btn {
			display: inline-block;
			background-color: #06b6d4;
			color: #0a0f1d !important;
			font-weight: 600;
			font-size: 16px;
			padding: 12px 24px;
			text-decoration: none;
			border-radius: 6px;
			margin-top: 15px;
			margin-bottom: 15px;
			text-align: center;
		}
		.footer {
			padding: 24px 40px;
			border-top: 1px solid rgba(255, 255, 255, 0.06);
			background-color: #0d1325;
			text-align: center;
		}
		.footer-text {
			font-size: 12px;
			color: #64748b;
			line-height: 1.5;
			margin: 0;
		}
		.footer-link {
			color: #06b6d4;
			text-decoration: none;
		}
	</style>
</head>
<body>
	<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" border="0">
		<tr>
			<td align="center">
				<table class="container" width="100%" cellpadding="0" cellspacing="0" border="0">
					<tr>
						<td>
							<div class="header-bar"></div>
							<div class="content" align="left">
								<div style="margin-bottom: 24px;">
									<a href="${baseUrl}" style="text-decoration: none; display: inline-block;">
										<img src="${logoUrl}" alt="SplitACharter" height="44" class="logo-img" style="display: block; height: 44px; width: auto; max-width: 240px; border: 0;" />
									</a>
								</div>
								<div class="body-text">
									${contentHtml}
								</div>
							</div>
							<table class="footer" width="100%" cellpadding="0" cellspacing="0" border="0">
								<tr>
									<td align="center">
										<p class="footer-text">
											This is an automated notification from <a href="${baseUrl}" class="footer-link">SplitACharter</a>.<br>
											© ${currentYear} SplitACharter. All rights reserved.
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;
}

/**
 * Formats a plain text email body into HTML by replacing newlines and upgrading URLs to buttons.
 */
export function formatEmailBody(text: string): string {
	if (!text) return '';

	// 1. Normalize literal escaped '\\n' and '\\r\\n' sequences (from DB strings/SQL) to actual newlines
	let normalized = text
		.replace(/\\r\\n/g, '\n')
		.replace(/\\n/g, '\n')
		.replace(/\r\n/g, '\n');

	// 2. Convert newlines to HTML break tags
	let html = normalized.replace(/\n/g, '<br />');

	// 3. Clean up 3 or more consecutive <br /> tags into 2
	html = html.replace(/(<br\s*\/?>\s*){3,}/gi, '<br /><br />');

	// 4. Upgrade URLs to styled CTA buttons or links
	const urlRegex = /https?:\/\/[^\s<]+/g;
	html = html.replace(urlRegex, (url) => {
		const isDashboard = url.endsWith('/dashboard');
		const isAccept = url.includes('/api/captain-match/accept');
		const isAuthCallback = url.includes('/auth/callback') || url.includes('magiclink');
		
		if (isDashboard) {
			return `<a href="${url}" class="btn">Go to Dashboard</a>`;
		} else if (isAccept) {
			return `<a href="${url}" class="btn" style="background-color: #6366f1; color: #ffffff !important;">Accept Charter</a>`;
		} else if (isAuthCallback) {
			return `<a href="${url}" class="btn">Sign In to Account</a>`;
		} else {
			return `<a href="${url}" style="color: #06b6d4; text-decoration: underline;">${url}</a>`;
		}
	});

	// 5. Trim trailing break tags right before CTA buttons for clean spacing
	html = html.replace(/(<br\s*\/?>\s*)+(?=<a [^>]*class="btn")/gi, '<br /><br />');

	return html;
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

	// Format inner body content and wrap in full HTML layout template
	const formattedInnerContent = formatEmailBody(htmlContent);
	const fullHtmlLayout = wrapInEmailLayout(formattedInnerContent, subject);

	if (isMock) {
		success = true;
		id = `mock_email_${Math.random().toString(36).substring(2, 10)}`;
		console.log(`[MOCK EMAIL] To: ${to} | Subject: "${subject}" | Content:\n${fullHtmlLayout}`);
	} else {
		try {
			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					from: RESEND_FROM_EMAIL || 'SplitACharter <onboarding@resend.dev>',
					to,
					subject,
					html: fullHtmlLayout
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
	const defaultBaseUrl = getSiteUrl();
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
