import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: captains, error: captainsErr } = await supabase
		.from('captains')
		.select('*')
		.order('created_at', { ascending: false });

	if (captainsErr) {
		console.error('Error loading captains for admin:', captainsErr);
		throw error(500, 'Failed to load captains');
	}

	return {
		captains: captains || []
	};
};
