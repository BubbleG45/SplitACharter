import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { supabase } }) => {
	const preselectedDate = url.searchParams.get('date') || '';

	const { data: listing, error: listingError } = await supabase
		.from('listing_templates')
		.select('*')
		.eq('id', params.id)
		.eq('active', true)
		.maybeSingle();

	if (listingError || !listing) {
		throw error(404, 'Listing template not found');
	}

	// Fetch existing active trip instances for this listing template
	// Only fetch instances that are 'half-booked' so the 2nd customer group can join them
	const { data: tripInstances, error: tripsError } = await supabase
		.from('trip_instances')
		.select('id, date, status')
		.eq('listing_template_id', params.id)
		.eq('status', 'half-booked');

	if (tripsError) {
		console.error('Error fetching trip instances:', tripsError);
	}

	return {
		listing,
		tripInstances: tripInstances || [],
		preselectedDate
	};
};
