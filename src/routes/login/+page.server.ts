import { fail, redirect } from '@sveltejs/kit';
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
	signInWithEmail: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email) {
			return fail(400, { message: 'Email address is required.' });
		}

		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			console.error('Email OTP sign in error:', error);
			return fail(500, { message: error.message || 'Failed to send magic link.' });
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
