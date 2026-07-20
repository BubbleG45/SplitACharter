import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { compileTemplate, wrapInEmailLayout } from '$lib/notifications';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const mockData = {
	customer_name: 'Alex Johnson',
	trip_date: '2026-08-24',
	trip_type: 'Deep Sea Sportfishing (8hr)',
	deadline_time: '2026-08-21 08:00 AM',
	captain_name: 'Jack Sparrow',
	captain_phone: '+1 (555) 019-2834',
	meeting_area: 'Slip B-12, Marina Del Rey',
	accept_url: 'http://localhost:5173/api/captain-match/accept?tripId=mock_trip_id&captainId=mock_captain_id',
	dashboard_url: 'http://localhost:5173/dashboard',
	passenger_list: 'Alex Johnson (group of 4), Sam Smith (group of 2)'
};

function formatEmailBody(text: string): string {
	let html = text.replace(/\n/g, '<br />');

	// Upgrade URLs to styled CTA buttons or links
	const urlRegex = /https?:\/\/[^\s<]+/g;
	html = html.replace(urlRegex, (url) => {
		const isDashboard = url.endsWith('/dashboard');
		const isAccept = url.includes('/api/captain-match/accept');
		
		if (isDashboard) {
			return `<br/><a href="${url}" class="btn" style="display: inline-block; background-color: #06b6d4; color: #0a0f1d; font-weight: 600; font-size: 16px; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; margin-bottom: 15px; text-align: center;">Go to Dashboard</a>`;
		} else if (isAccept) {
			return `<br/><a href="${url}" class="btn" style="display: inline-block; background-color: #6366f1; color: #f8fafc; font-weight: 600; font-size: 16px; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; margin-bottom: 15px; text-align: center;">Accept Charter</a>`;
		} else {
			return `<a href="${url}" style="color: #06b6d4; text-decoration: underline;">${url}</a>`;
		}
	});

	return html;
}

export const GET: RequestHandler = async ({ url }) => {
	const templateName = url.searchParams.get('template');

	// Fetch all available email templates from settings
	const { data: settings, error } = await supabaseAdmin
		.from('admin_notification_settings')
		.select('*');

	if (error) {
		return new Response(`Database Error: ${error.message}`, { status: 500 });
	}

	if (!templateName) {
		// Render index / menu
		let links = settings
			.filter((s) => s.email_template)
			.map((s) => `<li><a href="/api/preview-emails?template=${s.trigger_name}">${s.trigger_name.replace(/_/g, ' ').toUpperCase()}</a></li>`)
			.join('\n');
		links += `\n<li><a href="/api/preview-emails?template=auth_magic_link">AUTH MAGIC LINK</a></li>`;

		const htmlMenu = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>SplitACharter Email Previews</title>
				<style>
					body {
						background-color: #060913;
						color: #f8fafc;
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						padding: 40px;
					}
					h1 { color: #06b6d4; }
					ul { list-style: none; padding: 0; }
					li { margin-bottom: 15px; }
					a {
						color: #94a3b8;
						text-decoration: none;
						font-size: 18px;
						transition: color 0.2s;
					}
					a:hover { color: #06b6d4; }
				</style>
			</head>
			<body>
				<h1>Email Template Previews</h1>
				<p>Select an email template to view the responsive preview with live styles:</p>
				<ul>
					${links}
				</ul>
			</body>
			</html>
		`;
		return new Response(htmlMenu, { headers: { 'Content-Type': 'text/html' } });
	}

	if (templateName === 'auth_magic_link') {
		const rawBody = `Hello,\n\nPlease click the button below to sign in to your SplitACharter account. This link is only valid for 1 hour:\n\n${mockData.dashboard_url}/auth/callback?token=mock_magic_link_token`;
		const subject = 'Sign In to SplitACharter';
		const formattedInnerContent = formatEmailBody(rawBody);
		const fullHtmlLayout = wrapInEmailLayout(formattedInnerContent, subject);
		return new Response(fullHtmlLayout, { headers: { 'Content-Type': 'text/html' } });
	}

	const setting = settings.find((s) => s.trigger_name === templateName);
	if (!setting || !setting.email_template) {
		return new Response(`Template "${templateName}" not found or email is disabled/null.`, { status: 404 });
	}

	const rawBody = compileTemplate(setting.email_template, mockData);
	const subject = `SplitACharter Alert: ${templateName.replace(/_/g, ' ').toUpperCase()}`;
	
	const formattedInnerContent = formatEmailBody(rawBody);
	const fullHtmlLayout = wrapInEmailLayout(formattedInnerContent, subject);

	return new Response(fullHtmlLayout, { headers: { 'Content-Type': 'text/html' } });
};
