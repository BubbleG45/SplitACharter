import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { session, isAdmin } = await parent();

	if (!session || !isAdmin) {
		throw redirect(303, '/login');
	}

	return {};
};
