import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { inngest } from '$lib/inngest/client';
import { sendNotification } from '$lib/notifications';

export const GET: RequestHandler = async ({ url }) => {
	const tripId = url.searchParams.get('tripId');
	const captainId = url.searchParams.get('captainId');

	if (!tripId || !captainId) {
		throw error(400, 'Missing tripId or captainId parameter');
	}

	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	// 1. Perform atomic conditional update to claim the trip
	const { data: updatedTrip, error: updateErr } = await supabaseAdmin
		.from('trip_instances')
		.update({ captain_id: captainId })
		.eq('id', tripId)
		.is('captain_id', null)
		.select('id, date, listing_templates(trip_type, location, meeting_area)')
		.maybeSingle();

	if (updateErr) {
		console.error('Error claiming trip instance:', updateErr);
		throw error(500, 'Database error while claiming charter');
	}

	// 2. If updatedTrip exists, this captain secured the slot
	if (updatedTrip) {
		const tripDetails = (updatedTrip as any).listing_templates;
		const tripDateStr = updatedTrip.date;

		// Fetch Captain Details
		const { data: captain } = await supabaseAdmin
			.from('captains')
			.select('name, phone')
			.eq('id', captainId)
			.single();

		// Fetch Booking Customers on this TripInstance
		const { data: bookings } = await supabaseAdmin
			.from('bookings')
			.select('id, group_size, customers(name, phone, email)')
			.eq('trip_instance_id', tripId)
			.not('status', 'in', '("canceled","forfeited")');

		// Send trip/captain.matched event to Inngest to cancel matching workflows
		await inngest.send({
			name: 'trip/captain.matched',
			data: { tripInstanceId: tripId }
		});

		const captainName = captain?.name || 'Matched Captain';
		const captainPhone = captain?.phone || 'N/A';

		// Trigger notification to the winning Captain
		if (captain?.phone) {
			const passengerInfoList = bookings?.map(
				(b: any) => `${b.customers?.name || 'Customer'}: group of ${b.group_size} (${b.customers?.phone || 'no phone'})`
			).join(', ') || 'None';

			await sendNotification(
				'captain_secured',
				{ phone: captain.phone, name: captain.name },
				{
					trip_date: tripDateStr,
					trip_type: tripDetails?.trip_type || '',
					passenger_list: passengerInfoList
				}
			);
		}

		// Trigger notifications to both Customers
		if (bookings && bookings.length > 0) {
			for (const b of bookings) {
				const customer = (b as any).customers;
				if (customer) {
					await sendNotification(
						'captain_confirmed',
						{ email: customer.email, phone: customer.phone, name: customer.name },
						{
							captain_name: captainName,
							captain_phone: captainPhone,
							meeting_area: tripDetails?.meeting_area || '',
							trip_date: tripDateStr,
							trip_type: tripDetails?.trip_type || ''
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
