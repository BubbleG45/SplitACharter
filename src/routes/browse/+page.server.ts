import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [listingsRes, tripTypesRes] = await Promise.all([
		supabase
			.from('listing_templates')
			.select('*')
			.eq('active', true)
			.order('trip_type', { ascending: true }),
		supabase
			.from('trip_types')
			.select('*')
			.order('name', { ascending: true })
	]);

	if (listingsRes.error) {
		console.error('Error loading active listings:', listingsRes.error);
	}

	if (tripTypesRes.error) {
		console.error('Error loading trip types:', tripTypesRes.error);
	}

	return {
		listings: listingsRes.data || [],
		tripTypes: tripTypesRes.data || []
	};
};
