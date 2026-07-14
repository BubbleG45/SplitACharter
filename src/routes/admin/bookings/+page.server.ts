import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: bookings, error: bookingsErr } = await supabase
		.from('bookings')
		.select(`
			id,
			group_size,
			status,
			created_at,
			customers (
				name,
				email,
				phone
			),
			trip_instances (
				date,
				status,
				listing_templates (
					trip_type,
					location
				)
			)
		`)
		.order('created_at', { ascending: false });

	if (bookingsErr) {
		console.error('Error loading bookings for admin:', bookingsErr);
		throw error(500, 'Failed to load bookings');
	}

	return {
		bookings: bookings || []
	};
};
