import { error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	const refParam =
		url.searchParams.get('ref') ||
		url.searchParams.get('promo') ||
		url.searchParams.get('captain') ||
		'';

	const [listingsRes, tripTypesRes, areasRes, durationsRes, marinasRes, tripInstancesRes] =
		await Promise.all([
			supabase
				.from('listing_templates')
				.select(`
					*,
					areas (id, name, slug, description, mapbox_region),
					durations (id, name, label, hours)
				`)
				.eq('active', true)
				.order('trip_type', { ascending: true }),
			supabase.from('trip_types').select('*').order('name', { ascending: true }),
			supabase.from('areas').select('*').eq('active', true).order('name', { ascending: true }),
			supabase.from('durations').select('*').order('hours', { ascending: true }),
			supabase.from('marinas').select('id, name, address, latitude, longitude, active').eq('active', true),
			supabaseAdmin
				.from('trip_instances')
				.select(`
					id, date, status, listing_template_id,
					listing_templates (
						id, trip_type, location, duration, low_price, high_price, max_passengers,
						areas (id, name, slug),
						durations (id, name, label, hours)
					),
					bookings (group_size, status)
				`)
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
	if (areasRes.error) {
		console.error('Error loading areas:', areasRes.error);
	}
	if (durationsRes.error) {
		console.error('Error loading durations:', durationsRes.error);
	}
	if (tripInstancesRes.error) {
		console.error('Error loading half-booked trip instances:', tripInstancesRes.error);
	}

	return {
		listings: listingsRes.data || [],
		tripTypes: tripTypesRes.data || [],
		areas: areasRes.data || [],
		durations: durationsRes.data || [],
		marinas: marinasRes.data || [],
		halfBookedTrips: tripInstancesRes.data || [],
		referralCode: refParam.trim().toUpperCase()
	};
};
