import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { verifyCaptainToken } from '$lib/security';

export const load: PageServerLoad = async ({ url, parent }) => {
	const { isAdmin } = await parent();

	const tripId = url.searchParams.get('tripId');
	const captainId = url.searchParams.get('captainId');
	const token = url.searchParams.get('token');

	if (!tripId) {
		throw error(400, 'Missing tripId parameter');
	}

	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	// 1. Perform authorization check
	let isAuthorized = false;

	if (isAdmin) {
		isAuthorized = true;
	} else {
		if (!captainId || !token) {
			throw error(401, 'Unauthorized: Missing captainId or token credentials');
		}

		// Verify cryptographic signature
		const isValidSignature = verifyCaptainToken(tripId, captainId, token);
		if (!isValidSignature) {
			throw error(403, 'Forbidden: Invalid token signature');
		}

		// Double check database: Is this captain currently assigned to this trip?
		const { data: tripCheck, error: tripCheckErr } = await supabaseAdmin
			.from('trip_instances')
			.select('captain_id')
			.eq('id', tripId)
			.maybeSingle();

		if (tripCheckErr || !tripCheck) {
			throw error(404, 'Trip not found');
		}

		if (tripCheck.captain_id !== captainId) {
			throw error(403, 'Forbidden: You are not the assigned captain for this trip');
		}

		isAuthorized = true;
	}

	if (!isAuthorized) {
		throw error(403, 'Forbidden');
	}

	// 2. Fetch Trip and Listing Details
	const { data: trip, error: tripErr } = await supabaseAdmin
		.from('trip_instances')
		.select('id, date, status, captain_id, listing_templates(trip_type, location, meeting_area, description, duration_hours)')
		.eq('id', tripId)
		.maybeSingle();

	if (tripErr || !trip) {
		throw error(404, 'Trip not found');
	}

	// 3. Fetch Captain Details
	let captain = null;
	const activeCaptainId = trip.captain_id || captainId;
	if (activeCaptainId) {
		const { data: captainData } = await supabaseAdmin
			.from('captains')
			.select('name, phone, email')
			.eq('id', activeCaptainId)
			.maybeSingle();
		captain = captainData;
	}

	// 4. Fetch Active (paid/reconfirmed/held) Bookings & Passenger info
	const { data: bookings, error: bookingsErr } = await supabaseAdmin
		.from('bookings')
		.select('id, group_size, status, customers(name, phone, email)')
		.eq('trip_instance_id', tripId)
		.not('status', 'in', '("canceled","forfeited")');

	if (bookingsErr) {
		console.error('Error loading bookings for trip details:', bookingsErr);
		throw error(500, 'Database error loading passenger list');
	}

	return {
		trip,
		captain,
		bookings: bookings || [],
		isAdmin
	};
};
