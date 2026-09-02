import { redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') ?? 'magiclink';
	const next = url.searchParams.get('next') ?? '/';

	let authSuccess = false;

	if (token_hash) {
		const { error } = await supabase.auth.verifyOtp({
			token_hash,
			type: type as any
		});
		if (!error) {
			authSuccess = true;
		}
	} else if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			authSuccess = true;
		}
	}

	if (authSuccess) {
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (user) {
			const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

			// 1. Check if user is an admin
			const { data: adminRecord } = await supabaseAdmin
				.from('admin_users')
				.select('id')
				.eq('id', user.id)
				.maybeSingle();

			let isAdmin = !!adminRecord;

			if (!isAdmin && user.email) {
				const { data: adminEmailMatch } = await supabaseAdmin
					.from('admin_emails')
					.select('email')
					.ilike('email', user.email)
					.maybeSingle();

				if (adminEmailMatch) {
					isAdmin = true;
					await supabaseAdmin.from('admin_users').upsert({ id: user.id });
				}
			}

			if (isAdmin) {
				throw redirect(303, '/admin');
			}

			// 2. For customers, ensure customer record exists
			if (user.email) {
				const { data: existingCustomer } = await supabaseAdmin
					.from('customers')
					.select('id')
					.eq('id', user.id)
					.maybeSingle();

				if (!existingCustomer) {
					const customerName =
						user.user_metadata?.full_name ||
						user.user_metadata?.name ||
						user.email.split('@')[0] ||
						'Customer';

					await supabaseAdmin.from('customers').upsert(
						{
							id: user.id,
							name: customerName,
							email: user.email,
							phone: user.phone || '',
							sms_opt_in: false,
							how_heard: 'Google',
							updated_at: new Date().toISOString()
						},
						{ onConflict: 'id' }
					);
				}
			}

			throw redirect(303, next || '/');
		}
	}

	throw redirect(303, '/login?error=auth-failed');
};
