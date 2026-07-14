import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: listings, error } = await supabase
		.from('listing_templates')
		.select('*')
		.eq('active', true)
		.order('trip_type', { ascending: true });

	if (error) {
		console.error('Error loading active listings:', error);
	}

	return {
		listings: listings || []
	};
};
