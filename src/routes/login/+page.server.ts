import { fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { sendEmail } from '$lib/notifications';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session, isAdmin } = await safeGetSession();

	if (session) {
		if (isAdmin) {
			throw redirect(303, '/admin');
		} else {
			throw redirect(303, '/');
		}
	}

	return {};
};

export const actions: Actions = {
	signInWithEmail: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, { message: 'Email address is required.' });
		}

		// Use Admin Client to generate a passwordless sign-in link
		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
		
		// Determine target redirect path by checking if the email exists in admin_emails
		const { data: adminEmailMatch } = await supabaseAdmin
			.from('admin_emails')
			.select('email')
			.ilike('email', email)
			.maybeSingle();

		const nextPath = adminEmailMatch ? '/admin' : '/dashboard';
		const siteUrl = env.PUBLIC_SITE_URL || url.origin;
		const { data, error } = await supabaseAdmin.auth.admin.generateLink({
			type: 'magiclink',
			email,
			options: {
				redirectTo: `${siteUrl}/auth/callback?next=${nextPath}`
			}
		});

		if (error || !data?.properties?.action_link) {
			console.error('Email OTP sign in link generation error:', error);
			return fail(500, { message: error?.message || 'Failed to generate magic link.' });
		}

		const magicLink = data.properties.action_link;

		// Send email using our custom template and Resend
		const subject = 'Sign In to SplitACharter';
		const contentHtml = `Hello,\n\nPlease click the button below to sign in to your SplitACharter account. This link is only valid for 1 hour:\n\n${magicLink}\n\nIf you did not request this email, you can safely ignore it.`;

		const emailRes = await sendEmail(email, subject, contentHtml, 'auth_magic_link');

		if (!emailRes.success) {
			console.error('Email OTP sign in sending error:', emailRes.error);
			return fail(500, { message: emailRes.error || 'Failed to send magic link email.' });
		}

		return { success: true, method: 'email', message: 'Check your email inbox for the magic link!' };
	},

	signInWithPhone: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const phone = formData.get('phone') as string;

		if (!phone) {
			return fail(400, { message: 'Phone number is required.' });
		}

		const { error } = await supabase.auth.signInWithOtp({
			phone
		});

		if (error) {
			console.error('Phone OTP sign in error:', error);
			return fail(500, { message: error.message || 'Failed to send verification SMS.' });
		}

		return { success: true, method: 'phone', phone, message: 'SMS code sent! Please check your phone.' };
	},

	verifyOtp: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const phone = formData.get('phone') as string;
		const token = formData.get('token') as string;

		if (!phone || !token) {
			return fail(400, { message: 'Phone and verification code are required.' });
		}

		const { data, error } = await supabase.auth.verifyOtp({
			phone,
			token,
			type: 'sms'
		});

		if (error) {
			console.error('OTP verification error:', error);
			return fail(400, { message: error.message || 'Invalid or expired verification code.' });
		}

		// Success! Redirect based on whether they are admin
		const { data: adminRecord } = await supabase
			.from('admin_users')
			.select('id')
			.eq('id', data.user?.id)
			.maybeSingle();

		if (adminRecord) {
			throw redirect(303, '/admin');
		} else {
			throw redirect(303, '/');
		}
	},

	signOut: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		throw redirect(303, '/');
	}
};
