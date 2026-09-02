import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies, depends }) => {
	depends('supabase:auth');
	const { session, user, isAdmin } = await safeGetSession();

	return {
		session,
		user,
		isAdmin,
		cookies: cookies.getAll()
	};
};
