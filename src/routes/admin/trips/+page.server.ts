import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: trips, error: tripsErr } = await supabase
		.from('trip_instances')
		.select(`
			id,
			date,
			status,
			captain_id,
			captains (
				name,
				phone
			),
			listing_templates (
				trip_type,
				location,
				meeting_area
			)
		`)
		.order('date', { ascending: false });

	if (tripsErr) {
		console.error('Error loading trips for admin:', tripsErr);
		throw error(500, 'Failed to load trip instances');
	}

	return {
		trips: trips || []
	};
};
