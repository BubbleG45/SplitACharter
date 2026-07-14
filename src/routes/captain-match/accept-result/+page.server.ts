import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status');
	const tripId = url.searchParams.get('tripId');
	const captainId = url.searchParams.get('captainId');

	if (status === 'success') {
		if (!tripId || !captainId) {
			throw error(400, 'Missing parameter: tripId or captainId');
		}

		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Load Captain Details
		const { data: captain, error: capErr } = await supabaseAdmin
			.from('captains')
			.select('name, phone')
			.eq('id', captainId)
			.maybeSingle();

		if (capErr || !captain) {
			throw error(404, 'Captain record not found');
		}

		// Load Trip Details
		const { data: trip, error: tripErr } = await supabaseAdmin
			.from('trip_instances')
			.select('date, listing_templates(trip_type, location, meeting_area)')
			.eq('id', tripId)
			.maybeSingle();

		if (tripErr || !trip) {
			throw error(404, 'Trip record not found');
		}

		// Load passengers counts
		const { data: bookings } = await supabaseAdmin
			.from('bookings')
			.select('group_size')
			.eq('trip_instance_id', tripId)
			.not('status', 'in', '("canceled","forfeited")');

		const totalPassengers = bookings?.reduce((sum, b) => sum + b.group_size, 0) || 0;

		return {
			status,
			captain,
			trip,
			totalPassengers
		};
	}

	return {
		status
	};
};
