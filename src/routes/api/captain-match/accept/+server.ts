import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { inngest } from '$lib/inngest/client';
import { sendNotification } from '$lib/notifications';
import { generateCaptainToken } from '$lib/security';
import { calculateExactMarinaDriveTime } from '$lib/server/routing';

export const GET: RequestHandler = async ({ url }) => {
	const tripId = url.searchParams.get('tripId');
	const captainId = url.searchParams.get('captainId');

	if (!tripId || !captainId) {
		throw error(400, 'Missing tripId or captainId parameter');
	}

	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	// Fetch Captain Details & Home Marina
	const { data: captain } = await supabaseAdmin
		.from('captains')
		.select('id, name, phone, email, home_marina_id, marinas:home_marina_id(id, name, address, lat, lng)')
		.eq('id', captainId)
		.single();

	const homeMarina = (captain as any)?.marinas;

	// 1. Perform atomic conditional update to claim the trip and lock departure marina
	const { data: updatedTrip, error: updateErr } = await supabaseAdmin
		.from('trip_instances')
		.update({
			captain_id: captainId,
			marina_id: captain?.home_marina_id || null,
			needs_captain: false
		})
		.eq('id', tripId)
		.is('captain_id', null)
		.select('id, date, marina_id, listing_templates(trip_type, location, meeting_area)')
		.maybeSingle();

	if (updateErr) {
		console.error('Error claiming trip instance:', updateErr);
		throw error(500, 'Database error while claiming charter');
	}

	// 2. If updatedTrip exists, this captain secured the slot
	if (updatedTrip) {
		const tripDetails = (updatedTrip as any).listing_templates;
		const tripDateStr = updatedTrip.date;

		// Fetch Booking Customers on this TripInstance
		const { data: bookings } = await supabaseAdmin
			.from('bookings')
			.select('id, group_size, staying_address, staying_lat, staying_lng, customers(name, phone, email)')
			.eq('trip_instance_id', tripId)
			.not('status', 'in', '("canceled","forfeited")');

		// Send trip/captain.matched event to Inngest to cancel matching workflows
		try {
			await inngest.send({
				name: 'trip/captain.matched',
				data: { tripInstanceId: tripId }
			});
		} catch (inngestErr) {
			console.error('Inngest trip/captain.matched send failed (non-fatal):', inngestErr);
		}

		const captainName = captain?.name || 'Matched Captain';
		const captainPhone = captain?.phone || 'N/A';
		const marinaName = homeMarina?.name || tripDetails?.meeting_area || 'Designated Marina';
		const marinaAddress = homeMarina?.address || tripDetails?.location || '';

		// Trigger notification to the winning Captain with the secure details link
		if (captain?.phone || captain?.email) {
			const detailsToken = generateCaptainToken(tripId, captainId);
			const detailsUrl = `${url.origin}/captain-match/trip-details?tripId=${tripId}&captainId=${captainId}&token=${detailsToken}`;

			await sendNotification(
				'captain_details_link',
				{ phone: captain.phone, email: captain.email, name: captain.name },
				{
					trip_date: tripDateStr,
					trip_type: tripDetails?.trip_type || '',
					location: marinaAddress || tripDetails?.location || '',
					details_url: detailsUrl
				}
			);
		}

		// Compute exact drive times for participants who provided staying locations and update bookings
		if (bookings && bookings.length > 0) {
			for (const b of bookings) {
				let driveTimeInfo = '';
				if (b.staying_lat && b.staying_lng && homeMarina?.lat && homeMarina?.lng) {
					try {
						const driveCalc = await calculateExactMarinaDriveTime(
							{ lat: Number(b.staying_lat), lng: Number(b.staying_lng) },
							{
								id: homeMarina.id,
								name: homeMarina.name,
								address: homeMarina.address,
								lat: Number(homeMarina.lat),
								lng: Number(homeMarina.lng)
							}
						);

						// Update booking record with exact calculated drive time
						await supabaseAdmin
							.from('bookings')
							.update({
								drive_time_minutes: driveCalc.minutes,
								drive_time_text: driveCalc.text
							})
							.eq('id', b.id);

						driveTimeInfo = `Estimated Drive Time: ${driveCalc.text}\n`;
					} catch (driveErr) {
						console.error(`Error calculating drive time for booking ${b.id}:`, driveErr);
					}
				}

				const customer = (b as any).customers;
				if (customer) {
					await sendNotification(
						'captain_confirmed',
						{ email: customer.email, phone: customer.phone, name: customer.name },
						{
							customer_name: customer.name,
							captain_name: captainName,
							captain_phone: captainPhone,
							marina_name: marinaName,
							marina_address: marinaAddress,
							drive_time_info: driveTimeInfo,
							trip_date: tripDateStr,
							trip_type: tripDetails?.trip_type || '',
							dashboard_url: `${url.origin}/dashboard`
						}
					);
				}
			}
		}

		// Redirect to success page
		throw redirect(303, `/captain-match/accept-result?status=success&tripId=${tripId}&captainId=${captainId}`);
	} else {
		// 3. Otherwise, another captain claimed it first
		throw redirect(303, `/captain-match/accept-result?status=claimed`);
	}
};
