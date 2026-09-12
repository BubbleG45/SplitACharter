import { fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { sendEmail, getSiteUrl } from '$lib/notifications';
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
	signInWithGoogle: async ({ url, locals: { supabase } }) => {
		const siteUrl = getSiteUrl(url.origin);
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${siteUrl}/auth/callback`
			}
		});

		if (error || !data?.url) {
			console.error('Google OAuth sign-in error:', error);
			return fail(500, { message: error?.message || 'Failed to initialize Google sign-in.' });
		}

		throw redirect(303, data.url);
	},

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
		const siteUrl = getSiteUrl(url.origin);
		const { data, error } = await supabaseAdmin.auth.admin.generateLink({
			type: 'magiclink',
			email
		});

		if (error || !data?.properties?.hashed_token) {
			console.error('Email OTP sign in link generation error:', error);
			return fail(500, { message: error?.message || 'Failed to generate magic link.' });
		}

		const tokenHash = data.properties.hashed_token;
		const magicLink = `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=magiclink&next=${nextPath}`;

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
		const rawPhone = (formData.get('phone') as string)?.trim();

		if (!rawPhone) {
			return fail(400, { message: 'Phone number is required.' });
		}

		// Normalize phone to E.164 format
		let phone = rawPhone.replace(/[^\d+]/g, '');
		if (!phone.startsWith('+')) {
			if (phone.length === 10) {
				phone = `+1${phone}`;
			} else if (phone.length === 11 && phone.startsWith('1')) {
				phone = `+${phone}`;
			}
		}

		const { error } = await supabase.auth.signInWithOtp({
			phone
		});

		if (error) {
			console.error('Phone OTP sign in error:', error);
			if (error.message?.toLowerCase().includes('unsupported phone provider')) {
				return fail(500, {
					message:
						'SMS login is not enabled in the Supabase authentication settings yet. Please use the Email Magic Link or Google sign-in option above, or configure the Phone Provider in your Supabase dashboard.'
				});
			}
			return fail(500, { message: error.message || 'Failed to send verification SMS.' });
		}

		return {
			success: true,
			method: 'phone',
			step: 'otp',
			phone,
			attemptsLeft: 3,
			message: 'SMS code sent! Please check your phone.'
		};
	},

	verifyOtp: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		let phone = (formData.get('phone') as string)?.trim();
		const rawToken = (formData.get('token') as string)?.trim();
		const rawAttempts = (formData.get('attemptsLeft') as string)?.trim();
		let attemptsLeft = rawAttempts ? parseInt(rawAttempts, 10) : 3;
		if (isNaN(attemptsLeft) || attemptsLeft < 1) attemptsLeft = 3;

		const token = rawToken?.replace(/\D/g, '');

		if (!phone || !token) {
			return fail(400, {
				success: false,
				method: 'phone',
				step: 'otp',
				phone,
				attemptsLeft,
				message: 'Phone and verification code are required.'
			});
		}

		if (token.length !== 6) {
			const remaining = attemptsLeft - 1;
			if (remaining <= 0) {
				return fail(400, {
					success: false,
					method: 'phone',
					step: 'phone',
					phone,
					message: 'Too many incorrect attempts. Please request a new verification code.'
				});
			}
			return fail(400, {
				success: false,
				method: 'phone',
				step: 'otp',
				phone,
				attemptsLeft: remaining,
				message: `Verification code must be 6 digits. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
			});
		}

		// Normalize phone to E.164 format
		phone = phone.replace(/[^\d+]/g, '');
		if (!phone.startsWith('+')) {
			if (phone.length === 10) {
				phone = `+1${phone}`;
			} else if (phone.length === 11 && phone.startsWith('1')) {
				phone = `+${phone}`;
			}
		}

		const { data, error } = await supabase.auth.verifyOtp({
			phone,
			token,
			type: 'sms'
		});

		if (error) {
			console.error('OTP verification error:', error);
			const remaining = attemptsLeft - 1;
			if (remaining <= 0) {
				return fail(400, {
					success: false,
					method: 'phone',
					step: 'phone',
					phone,
					message: 'Too many incorrect attempts. Please request a new verification code.'
				});
			}
			return fail(400, {
				success: false,
				method: 'phone',
				step: 'otp',
				phone,
				attemptsLeft: remaining,
				message: `Invalid verification code. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
			});
		}

		// Success! Redirect based on whether they are admin
		const { data: adminRecord } = await supabase
			.from('admin_users')
			.select('id')
			.eq('id', data.user?.id)
			.maybeSingle();

		let isAdmin = !!adminRecord;
		if (!isAdmin && data.user?.email) {
			const { data: adminEmailMatch } = await supabase
				.from('admin_emails')
				.select('email')
				.ilike('email', data.user.email)
				.maybeSingle();

			if (adminEmailMatch) {
				isAdmin = true;
				await supabase.from('admin_users').upsert({ id: data.user.id });
			}
		}

		if (isAdmin) {
			throw redirect(303, '/admin');
		} else {
			throw redirect(303, '/dashboard');
		}
	},

	signOut: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		throw redirect(303, '/');
	}
};
