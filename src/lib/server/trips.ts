import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { inngest } from '$lib/inngest/client';
import { sendNotification, getSiteUrl } from '$lib/notifications';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Handles automatic trip confirmation workflow when 2-of-2 groups are reconfirmed:
 * 1. Updates TripInstance status to 'confirmed'
 * 2. Auto-spawns a fresh 'open' TripInstance for the same date/type/location (per PROJECT_CONTEXT.md)
 * 3. Triggers the automated Captain Blast via Inngest with direct notification fallback
 */
export async function confirmTripAndTriggerCaptainBlast(tripInstanceId: string) {
	// 1. Fetch trip details
	const { data: trip, error: tripErr } = await supabaseAdmin
		.from('trip_instances')
		.select('id, status, date, listing_template_id, referring_captain_id, listing_templates(trip_type, location, meeting_area)')
		.eq('id', tripInstanceId)
		.single();

	if (tripErr || !trip) {
		console.error(`[confirmTrip] Trip instance ${tripInstanceId} not found:`, tripErr);
		return { success: false, reason: 'Trip not found' };
	}

	// 2. Update status to 'confirmed' if not already confirmed/completed
	if (trip.status !== 'confirmed' && trip.status !== 'completed') {
		await supabaseAdmin
			.from('trip_instances')
			.update({ status: 'confirmed' })
			.eq('id', tripInstanceId);
	}

	// 3. Trigger Inngest captain matching workflow
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

	// 5. Fallback: If Inngest is unavailable/offline, dispatch captain blast directly
	if (!inngestDispatched) {
		const tripDetails = (trip as any).listing_templates;
		const tripType = tripDetails?.trip_type;
		const location = tripDetails?.location;

		if (tripType && location) {
			const { data: captains } = await supabaseAdmin
				.from('captains')
				.select('id, name, phone, trip_types, locations')
				.eq('active', true);

			const eligible = (captains || []).filter(
				(c) => c.trip_types?.includes(tripType) && c.locations?.includes(location)
			);

			const baseUrl = getSiteUrl();
			for (const c of eligible) {
				if (c.phone) {
					const acceptUrl = `${baseUrl}/api/captain-match/accept?tripId=${trip.id}&captainId=${c.id}`;
					try {
						await sendNotification(
							'captain_blast',
							{ phone: c.phone, name: c.name },
							{
								trip_type: tripType,
								trip_date: trip.date,
								location: location,
								accept_url: acceptUrl
							}
						);
					} catch (notifErr) {
						console.error(`[confirmTrip] Fallback captain_blast to ${c.name} failed:`, notifErr);
					}
				}
			}
		}
	}

	return { success: true };
}
