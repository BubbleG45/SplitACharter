import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { inngest } from '$lib/inngest/client';
import { sendNotification, getSiteUrl } from '$lib/notifications';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface MatchingCaptain {
	id: string;
	name: string;
	phone: string;
	email: string;
	home_marina_id: string;
	trip_types: string[];
	durations: string[];
}

/**
 * Finds all eligible active captains who match a trip instance's template requirements:
 * 1. Captain is active.
 * 2. Captain's home marina is active and associated with the trip's area.
 * 3. Captain offers the trip's charter type.
 * 4. Captain offers the trip's duration.
 */
export async function findMatchingCaptainsForTrip(tripInstanceId: string): Promise<{
	trip: any;
	matchingCaptains: MatchingCaptain[];
	referringCaptains: MatchingCaptain[];
}> {
	// 1. Fetch trip and its listing template details
	const { data: trip, error: tripErr } = await supabaseAdmin
		.from('trip_instances')
		.select(`
			id, status, date, listing_template_id, needs_captain,
			listing_templates (
				id, trip_type, location, meeting_area, area_id, duration_id, duration,
				areas (id, name, slug, active),
				durations (id, name, label, hours)
			)
		`)
		.eq('id', tripInstanceId)
		.single();

	if (tripErr || !trip) {
		console.error(`[findMatchingCaptains] Trip instance ${tripInstanceId} not found:`, tripErr);
		return { trip: null, matchingCaptains: [], referringCaptains: [] };
	}

	const template = (trip as any).listing_templates;
	const areaId = template?.area_id;
	const tripType = template?.trip_type;
	const durationName = template?.durations?.name;

	// 2. Fetch all active marinas associated with this Area
	let validMarinaIds: string[] = [];
	if (areaId) {
		const { data: marinaAreas } = await supabaseAdmin
			.from('marina_areas')
			.select('marina_id, marinas(id, active)')
			.eq('area_id', areaId);

		validMarinaIds = (marinaAreas || [])
			.filter((ma: any) => ma.marinas?.active)
			.map((ma: any) => ma.marina_id);
	}

	// 3. Fetch active captains
	const { data: allCaptains, error: capErr } = await supabaseAdmin
		.from('captains')
		.select('id, name, phone, email, home_marina_id, trip_types, durations, locations, active')
		.eq('active', true);

	if (capErr || !allCaptains) {
		console.error('[findMatchingCaptains] Error querying captains:', capErr);
		return { trip, matchingCaptains: [], referringCaptains: [] };
	}

	// 4. Filter matching captains strictly per location & charter offerings
	const tripLocation = template?.location;
	const matchingCaptains = allCaptains.filter((c: any) => {
		// Must offer the charter type
		const matchesType = c.trip_types?.includes(tripType);
		if (!matchesType) return false;

		// Must offer the duration (if durations are defined on captain, must match; fallback to true if captain has empty durations)
		const matchesDuration =
			!c.durations || c.durations.length === 0 || (durationName && c.durations.includes(durationName));
		if (!matchesDuration) return false;

		// Location check: Captain's selected locations must include the trip's location
		const matchesLocation =
			tripLocation &&
			Array.isArray(c.locations) &&
			c.locations.some((loc: string) => loc.toLowerCase() === tripLocation.toLowerCase());
		if (!matchesLocation) return false;

		return true;
	});

	// Referring captains (for priority window)
	const refIds = new Set<string>();
	if ((trip as any).referring_captain_id) refIds.add((trip as any).referring_captain_id);
	if (Array.isArray((trip as any).referring_captain_ids)) {
		for (const id of (trip as any).referring_captain_ids) {
			if (id) refIds.add(id);
		}
	}
	const referringCaptains = matchingCaptains.filter((c) => refIds.has(c.id));

	return { trip, matchingCaptains, referringCaptains };
}

/**
 * Handles automatic trip confirmation workflow when 2-of-2 groups are reconfirmed:
 * 1. Updates TripInstance status to 'confirmed'
 * 2. Checks matching captains.
 * 3. If 0 matching captains: flags as 'needs_captain = true' and alerts admin via Email + SMS.
 * 4. If matching captains exist: dispatches captain blast via Inngest with direct fallback.
 */
export async function confirmTripAndTriggerCaptainBlast(tripInstanceId: string) {
	// 1. Check matching captains
	const { trip, matchingCaptains, referringCaptains } = await findMatchingCaptainsForTrip(tripInstanceId);

	if (!trip) {
		return { success: false, reason: 'Trip not found' };
	}

	// 2. Update status to 'confirmed' if not already confirmed/completed
	if (trip.status !== 'confirmed' && trip.status !== 'completed') {
		await supabaseAdmin
			.from('trip_instances')
			.update({ status: 'confirmed' })
			.eq('id', tripInstanceId);
	}

	const template = trip.listing_templates;
	const areaName = template?.areas?.name || template?.location || 'Florida Keys';
	const tripType = template?.trip_type || 'Charter';
	const durationLabel = template?.durations?.label || 'Standard';

	// 3. Handle Zero Matching Captains: Flag as Needs Captain + Alert Operations Team
	if (matchingCaptains.length === 0) {
		console.warn(`[confirmTrip] Trip ${tripInstanceId} has NO matching captains! Flagging as needs_captain.`);

		await supabaseAdmin
			.from('trip_instances')
			.update({
				needs_captain: true,
				needs_captain_flagged_at: new Date().toISOString()
			})
			.eq('id', tripInstanceId);

		// Calculate total passengers on trip
		const { data: bookings } = await supabaseAdmin
			.from('bookings')
			.select('group_size')
			.eq('trip_instance_id', tripInstanceId)
			.not('status', 'in', '("canceled","forfeited")');

		const totalPax = (bookings || []).reduce((acc: number, b: any) => acc + (b.group_size || 0), 0);
		const baseUrl = getSiteUrl();
		const adminUrl = `${baseUrl}/admin/trips?tab=needs-captain&tripId=${tripInstanceId}`;

		// Dispatch Immediate SMS and Email to Admin
		const adminEmail = env.ADMIN_EMAIL || 'admin@splitacharter.com';
		const adminPhone = env.TWILIO_PHONE_NUMBER || '';

		try {
			await sendNotification(
				'admin_needs_captain_alert',
				{ email: adminEmail, phone: adminPhone, name: 'SplitACharter Operations' },
				{
					trip_date: trip.date,
					trip_type: tripType,
					area_name: areaName,
					duration_label: durationLabel,
					total_passengers: String(totalPax),
					admin_url: adminUrl
				}
			);
		} catch (adminAlertErr) {
			console.error('[confirmTrip] Error sending admin needs_captain alert:', adminAlertErr);
		}

		return { success: true, needs_captain: true };
	}

	// 4. Matching captains exist -> Ensure needs_captain is false
	await supabaseAdmin
		.from('trip_instances')
		.update({ needs_captain: false })
		.eq('id', tripInstanceId);

	// 5. Trigger Inngest captain matching workflow
	let inngestDispatched = false;
	try {
		await inngest.send({
			name: 'trip/confirmed',
			data: { tripInstanceId }
		});
		inngestDispatched = true;
	} catch (inngestErr) {
		console.warn('[confirmTrip] Inngest trip/confirmed event dispatch failed, executing direct fallback:', inngestErr);
	}

	// 6. Direct fallback if Inngest is offline
	if (!inngestDispatched) {
		const baseUrl = getSiteUrl();
		for (const c of matchingCaptains) {
			if (c.phone || c.email) {
				const acceptUrl = `${baseUrl}/api/captain-match/accept?tripId=${trip.id}&captainId=${c.id}`;
				try {
					await sendNotification(
						'captain_blast',
						{ phone: c.phone, email: c.email, name: c.name },
						{
							trip_type: tripType,
							trip_date: trip.date,
							location: areaName,
							accept_url: acceptUrl
						}
					);
				} catch (notifErr) {
					console.error(`[confirmTrip] Fallback captain_blast to ${c.name} failed:`, notifErr);
				}
			}
		}
	}

	return { success: true, matching_captains_count: matchingCaptains.length };
}

/**
 * When coverage is added (new captain onboarded, home marina assigned, type/duration enabled),
 * automatically scans for upcoming 'needs_captain = true' trips and releases them to newly matched captains.
 */
export async function releasePendingNeedsCaptainTrips(): Promise<number> {
	const todayStr = new Date().toISOString().split('T')[0];

	const { data: pendingTrips, error: tripsErr } = await supabaseAdmin
		.from('trip_instances')
		.select('id, date, status, listing_template_id')
		.eq('needs_captain', true)
		.gte('date', todayStr);

	if (tripsErr || !pendingTrips || pendingTrips.length === 0) {
		return 0;
	}

	let releasedCount = 0;

	for (const pt of pendingTrips) {
		const { trip, matchingCaptains } = await findMatchingCaptainsForTrip(pt.id);
		if (matchingCaptains.length > 0) {
			console.log(`[releasePendingNeedsCaptainTrips] Trip ${pt.id} now has ${matchingCaptains.length} matching captains! Releasing.`);

			// Unflag needs_captain
			await supabaseAdmin
				.from('trip_instances')
				.update({ needs_captain: false })
				.eq('id', pt.id);

			const template = trip.listing_templates;
			const areaName = template?.areas?.name || template?.location || 'Florida Keys';
			const tripType = template?.trip_type || 'Charter';
			const baseUrl = getSiteUrl();

			// Blast all matching captains
			for (const c of matchingCaptains) {
				if (c.phone || c.email) {
					const acceptUrl = `${baseUrl}/api/captain-match/accept?tripId=${pt.id}&captainId=${c.id}`;
					try {
						await sendNotification(
							'captain_blast',
							{ phone: c.phone, email: c.email, name: c.name },
							{
								trip_type: tripType,
								trip_date: pt.date,
								location: areaName,
								accept_url: acceptUrl
							}
						);
					} catch (blastErr) {
						console.error(`[releasePendingNeedsCaptainTrips] Blast error to ${c.name}:`, blastErr);
					}
				}
			}

			// Alert admin that trip was released
			const adminEmail = env.ADMIN_EMAIL || 'admin@splitacharter.com';
			const adminPhone = env.TWILIO_PHONE_NUMBER || '';
			try {
				await sendNotification(
					'admin_needs_captain_released',
					{ email: adminEmail, phone: adminPhone, name: 'SplitACharter Operations' },
					{
						trip_date: pt.date,
						trip_type: tripType,
						area_name: areaName,
						captain_count: String(matchingCaptains.length),
						admin_url: `${baseUrl}/admin/trips?tripId=${pt.id}`
					}
				);
			} catch (err) {
				console.error('[releasePendingNeedsCaptainTrips] Admin release notification error:', err);
			}

			releasedCount++;
		}
	}

	return releasedCount;
}
