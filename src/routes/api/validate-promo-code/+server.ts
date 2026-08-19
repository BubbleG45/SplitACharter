import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { formatPromoCode } from '$lib/promo_codes';

export const GET: RequestHandler = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return json({ valid: false, status: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	const rawCode = url.searchParams.get('code');
	const code = formatPromoCode(rawCode);
	const templateId = url.searchParams.get('templateId');

	if (!code) {
		return json({ valid: false, status: 'empty', message: 'No promo code provided.' });
	}

	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	// 1. Fetch captain by referral promo code
	let captainQuery = supabaseAdmin
		.from('captains')
		.select('*')
		.ilike('referral_promo_code', code)
		.maybeSingle();

	const { data: captain, error: captainErr } = await captainQuery;

	if (captainErr || !captain) {
		return json({
			valid: false,
			status: 'invalid',
			message: `Promo code '${code}' was not found. Please check for typos.`
		});
	}

	if (!captain.active) {
		return json({
			valid: false,
			status: 'inactive',
			message: `Promo code '${code}' belongs to an inactive captain.`
		});
	}

	const captainDisplayName = captain.charter_name
		? `Captain ${captain.name} (${captain.charter_name})`
		: `Captain ${captain.name}`;

	// 2. Verify captain covers the listing's location and trip_type if templateId is provided
	if (templateId) {
		const { data: listing } = await supabaseAdmin
			.from('listing_templates')
			.select('location, trip_type')
			.eq('id', templateId)
			.maybeSingle();

		if (listing) {
			const captainLocations = (captain.locations || []).map((l: string) => l.toLowerCase().trim());
			const captainTripTypes = (captain.trip_types || []).map((t: string) => t.toLowerCase().trim());

			const listingLoc = listing.location.toLowerCase().trim();
			const listingType = listing.trip_type.toLowerCase().trim();

			const matchesLocation = captainLocations.some((loc: string) =>
				loc.includes(listingLoc) || listingLoc.includes(loc)
			);
			const matchesTripType = captainTripTypes.some((tt: string) =>
				tt.includes(listingType) || listingType.includes(tt)
			);

			if (!matchesLocation || !matchesTripType) {
				const missingDetails = [];
				if (!matchesLocation) missingDetails.push(`location (${listing.location})`);
				if (!matchesTripType) missingDetails.push(`trip type (${listing.trip_type})`);

				return json({
					valid: false,
					status: 'mismatch',
					captainName: captain.name,
					charterName: captain.charter_name || null,
					message: `${captainDisplayName}'s promo code is active, but they do not service this ${missingDetails.join(' and ')}.`
				});
			}
		}
	}

	return json({
		valid: true,
		status: 'valid',
		captainId: captain.id,
		captainName: captain.name,
		charterName: captain.charter_name || null,
		promoCode: captain.referral_promo_code,
		message: `Code applied! Booking referral priority granted for ${captainDisplayName}.`
	});
};
