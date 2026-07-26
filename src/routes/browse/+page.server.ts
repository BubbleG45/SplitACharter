import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	const [listingsRes, tripTypesRes, tripInstancesRes] = await Promise.all([
		supabase
			.from('listing_templates')
			.select('*')
			.eq('active', true)
			.order('trip_type', { ascending: true }),
		supabase
			.from('trip_types')
			.select('*')
			.order('name', { ascending: true }),
		supabaseAdmin
			.from('trip_instances')
			.select('id, date, status, listing_template_id, listing_templates(id, trip_type, location, duration, low_price, high_price, max_passengers), bookings(group_size, status)')
			.eq('status', 'half-booked')
			.gte('date', new Date().toISOString().split('T')[0])
			.order('date', { ascending: true })
	]);

	if (listingsRes.error) {
		console.error('Error loading active listings:', listingsRes.error);
	}

	if (tripTypesRes.error) {
		console.error('Error loading trip types:', tripTypesRes.error);
	}

	if (tripInstancesRes.error) {
		console.error('Error loading half-booked trip instances:', tripInstancesRes.error);
	}

	return {
		listings: listingsRes.data || [],
		tripTypes: tripTypesRes.data || [],
		halfBookedTrips: tripInstancesRes.data || []
	};
};
