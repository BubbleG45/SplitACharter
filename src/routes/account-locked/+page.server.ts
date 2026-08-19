import type { PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return {
			isLoggedIn: false,
			profile: null
		};
	}

	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
	const { data: profile } = await supabaseAdmin
		.from('customers')
		.select('id, name, email, phone, strike_count, flagged')
		.eq('id', user.id)
		.maybeSingle();

	return {
		isLoggedIn: true,
		profile: profile || {
			id: user.id,
			name: user.user_metadata?.full_name || 'Customer',
			email: user.email || '',
			phone: user.phone || '',
			strike_count: 3,
			flagged: true
		}
	};
};
