import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
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
