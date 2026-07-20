import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') ?? 'magiclink';
	const next = url.searchParams.get('next') ?? '/';

	if (token_hash) {
		const { error } = await supabase.auth.verifyOtp({
			token_hash,
			type: type as any
		});

		if (!error) {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const { data: adminRecord } = await supabase
					.from('admin_users')
					.select('id')
					.eq('id', user.id)
					.maybeSingle();
				
				if (adminRecord) {
					throw redirect(303, '/admin');
				}
			}
			throw redirect(303, next);
		}
	} else if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const { data: adminRecord } = await supabase
					.from('admin_users')
					.select('id')
					.eq('id', user.id)
					.maybeSingle();
				
				if (adminRecord) {
					throw redirect(303, '/admin');
				}
			}
			throw redirect(303, next);
		}
	}

	throw redirect(303, '/login?error=auth-failed');
};
