import { error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { supabase } }) => {
	const preselectedDate = url.searchParams.get('date') || '';
	const refParam = url.searchParams.get('ref') || url.searchParams.get('promo') || url.searchParams.get('captain') || '';

	const { data: listing, error: listingError } = await supabase
		.from('listing_templates')
		.select('*')
		.eq('id', params.id)
		.eq('active', true)
		.maybeSingle();

	if (listingError || !listing) {
		throw error(404, 'Listing template not found');
	}

	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	// Fetch existing active trip instances for this listing template
	// Only fetch instances that are 'half-booked' so the 2nd customer group can join them
	const { data: tripInstances, error: tripsError } = await supabaseAdmin
		.from('trip_instances')
		.select('id, date, status, bookings(group_size, status)')
		.eq('listing_template_id', params.id)
		.eq('status', 'half-booked');

	if (tripsError) {
		console.error('Error fetching trip instances:', tripsError);
	}

	let maxAvailablePassengers = Math.min(4, Math.max(1, listing.max_passengers - 1));
	if (preselectedDate && tripInstances) {
		const matched = tripInstances.find((t) => t.date === preselectedDate);
		if (matched) {
			const activeBookings = (matched.bookings || []).filter(
				(b: any) => b.status !== 'canceled' && b.status !== 'forfeited'
			);
			const bookedPax = activeBookings.reduce((sum: number, b: any) => sum + (b.group_size || 0), 0);
			maxAvailablePassengers = Math.min(4, Math.max(0, listing.max_passengers - bookedPax));
		}
	}

	return {
		listing,
		tripInstances: tripInstances || [],
		preselectedDate,
		maxAvailablePassengers,
		referralCode: refParam.trim().toUpperCase(),
		origin: url.origin
	};
};
