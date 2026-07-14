import { inngest } from './client';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { calculateReconfirmSchedule } from '../reconfirmation';
import { sendSMS } from '../sms';
import { sendNotification } from '../notifications';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// A simple hello world background function to verify the end-to-end integration
export const helloWorld = inngest.createFunction(
	{
		id: 'hello-world',
		name: 'Hello World',
		triggers: [{ event: 'test/hello.world' }]
	},
	async ({ event, step }) => {
		const result = await step.run('log-message', () => {
			console.log('Hello, Inngest! Event received:', event);
			return { message: `Hello World! Event '${event.name}' successfully processed.` };
		});

		return result;
	}
);

// Reconfirmation logic workflow
export const reconfirmBookingWorkflow = inngest.createFunction(
	{
		id: 'reconfirm-booking-workflow',
		name: 'Reconfirm Booking Workflow',
		triggers: [{ event: 'booking/match.detected' }],
		cancelOn: [
			{
				event: 'booking/reconfirmed',
				match: 'data.bookingId'
			},
			{
				event: 'booking/cancelled',
				match: 'data.bookingId'
			}
		]
	},
	async ({ event, step }) => {
		const { bookingId, tripDateTime, matchTime } = event.data;

		// 1. Calculate the deadline and reminders schedule
		const schedule = await step.run('calculate-schedule', () => {
			return calculateReconfirmSchedule(tripDateTime, matchTime);
		});

		// 2. Schedule reminders
		for (let i = 0; i < schedule.reminderDates.length; i++) {
			const reminderTime = schedule.reminderDates[i];
			await step.sleepUntil(`sleep-until-reminder-${i + 1}`, reminderTime);
			
			await step.run(`send-reminder-${i + 1}`, async () => {
				const { data: booking } = await supabaseAdmin
					.from('bookings')
					.select('id, customer_id, customers(name, phone, email)')
					.eq('id', bookingId)
					.single();

				const customer = (booking as any)?.customers;
				if (customer) {
					await sendNotification(
						'reconfirm_reminder',
						{ email: customer.email, phone: customer.phone, name: customer.name },
						{
							trip_date: tripDateTime.split('T')[0],
							deadline_time: new Date(schedule.deadlineDate).toLocaleString()
						}
					);
				}
			});
		}

		// 3. Sleep until the final deadline
		await step.sleepUntil('sleep-until-deadline', schedule.deadlineDate);

		// 4. Enforce forfeiture if not reconfirmed by deadline
		const result = await step.run('enforce-forfeiture', async () => {
			const { data: booking, error: bookingErr } = await supabaseAdmin
				.from('bookings')
				.select('id, customer_id, trip_instance_id, status, customers(name, phone, email)')
				.eq('id', bookingId)
				.single();

			if (bookingErr || !booking) {
				return { status: 'skipped', reason: 'Booking not found' };
			}

			// If the booking is already reconfirmed or canceled, we don't enforce forfeiture
			if (booking.status === 'reconfirmed' || booking.status === 'canceled' || booking.status === 'forfeited') {
				return { status: 'skipped', reason: `Booking is already in state: ${booking.status}` };
			}

			// Update this booking to forfeited
			await supabaseAdmin
				.from('bookings')
				.update({ status: 'forfeited' })
				.eq('id', bookingId);

			// Send notification to customer
			const customerProfile = (booking as any)?.customers;
			if (customerProfile) {
				await sendNotification(
					'reconfirm_forfeited',
					{ email: customerProfile.email, phone: customerProfile.phone, name: customerProfile.name },
					{ trip_date: tripDateTime.split('T')[0] }
				);
			}

			// Increment customer strike count
			const { data: customer } = await supabaseAdmin
				.from('customers')
				.select('strike_count')
				.eq('id', booking.customer_id)
				.single();

			const newStrikeCount = (customer?.strike_count || 0) + 1;
			const flagged = newStrikeCount >= 3;

			await supabaseAdmin
				.from('customers')
				.update({
					strike_count: newStrikeCount,
					flagged
				})
				.eq('id', booking.customer_id);

			// Mark payment record as forfeited
			await supabaseAdmin
				.from('payment_records')
				.update({ status: 'forfeited' })
				.eq('booking_id', bookingId);

			// Retrieve counterpart bookings on the same trip instance
			const { data: otherBookings } = await supabaseAdmin
				.from('bookings')
				.select('id, status')
				.eq('trip_instance_id', booking.trip_instance_id)
				.neq('id', bookingId);

			// Update counterpart bookings to 'held'
			if (otherBookings && otherBookings.length > 0) {
				for (const other of otherBookings) {
					if (other.status === 'reconfirmed' || other.status === 'paid' || other.status === 'awaiting-reconfirm') {
						await supabaseAdmin
							.from('bookings')
							.update({ status: 'held' })
							.eq('id', other.id);
					}
				}
			}

			// Reset TripInstance to open
			await supabaseAdmin
				.from('trip_instances')
				.update({ status: 'open' })
				.eq('id', booking.trip_instance_id);

			return {
				status: 'enforced',
				bookingId,
				newStrikeCount,
				flagged
			};
		});

		return result;
	}
);

// Captain Matching Workflow
export const captainMatchingWorkflow = inngest.createFunction(
	{
		id: 'captain-matching-workflow',
		name: 'Captain Matching Workflow',
		triggers: [{ event: 'trip/confirmed' }],
		cancelOn: [
			{
				event: 'trip/captain.matched',
				match: 'data.tripInstanceId'
			}
		]
	},
	async ({ event, step }) => {
		const { tripInstanceId } = event.data;

		// 1. Fetch Trip details and find eligible captains
		const matchData = await step.run('find-eligible-captains', async () => {
			const { data: trip } = await supabaseAdmin
				.from('trip_instances')
				.select('id, date, listing_templates(trip_type, location, meeting_area)')
				.eq('id', tripInstanceId)
				.single();

			if (!trip) {
				return { trip: null, captains: [] };
			}

			const tripDetails = (trip as any).listing_templates;
			const tripType = tripDetails?.trip_type;
			const location = tripDetails?.location;

			// Fetch active captains
			const { data: captains } = await supabaseAdmin
				.from('captains')
				.select('id, name, phone, trip_types, locations')
				.eq('active', true);

			if (!captains) {
				return { trip, captains: [] };
			}

			// Filter in JS
			const eligible = captains.filter((c) =>
				c.trip_types?.includes(tripType) &&
				c.locations?.includes(location)
			);

			return { trip, captains: eligible };
		});

		if (!matchData.trip) {
			return { status: 'skipped', reason: 'Trip not found' };
		}

		// 2. Dispatch simultaneous SMS blast to all matching captains
		await step.run('dispatch-sms-blast', async () => {
			const trip = matchData.trip;
			const tripDetails = (trip as any).listing_templates;
			const captains = matchData.captains;

			if (captains.length === 0) {
				console.log(`[Captain Blast] No eligible captains found for trip ${tripInstanceId}`);
				return { status: 'no_captains' };
			}

			const baseUrl = 'http://localhost:5173'; // Default dev app url

			for (const c of captains) {
				if (c.phone) {
					const acceptUrl = `${baseUrl}/api/captain-match/accept?tripId=${trip.id}&captainId=${c.id}`;
					await sendNotification(
						'captain_blast',
						{ phone: c.phone, name: c.name },
						{
							trip_type: tripDetails?.trip_type || '',
							trip_date: trip.date,
							location: tripDetails?.location || '',
							accept_url: acceptUrl
						}
					);
				}
			}

			return { status: 'blast_sent', count: captains.length };
		});

		// 3. Sleep until 24 hours before trip departure date (assumed 8am local time departure)
		const tripDate = matchData.trip.date;
		const deadlineDate = new Date(`${tripDate}T08:00:00.000Z`);
		const matchingTimeoutTime = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000);

		await step.sleepUntil('sleep-until-notice-deadline', matchingTimeoutTime);

		// 4. Enforce timeout if no captain matched in time
		const result = await step.run('enforce-timeout', async () => {
			const { data: trip } = await supabaseAdmin
				.from('trip_instances')
				.select('id, captain_id, date, listing_templates(trip_type, meeting_area)')
				.eq('id', tripInstanceId)
				.single();

			if (!trip) {
				return { status: 'skipped', reason: 'Trip not found' };
			}

			// If captain was assigned, do nothing (matching was successful)
			if (trip.captain_id) {
				return { status: 'skipped', reason: 'Captain was successfully matched' };
			}

			// Otherwise, matching timed out. Cancel trip instance and refund customers
			await supabaseAdmin
				.from('trip_instances')
				.update({ status: 'canceled' })
				.eq('id', tripInstanceId);

			// Retrieve all active bookings for this trip
			const { data: bookings } = await supabaseAdmin
				.from('bookings')
				.select('id, customer_id, customers(name, phone, email)')
				.eq('trip_instance_id', tripInstanceId)
				.not('status', 'in', '("canceled","forfeited")');

			if (bookings && bookings.length > 0) {
				const tripDetails = (trip as any).listing_templates;

				for (const b of bookings) {
					// Update booking to canceled
					await supabaseAdmin
						.from('bookings')
						.update({ status: 'canceled' })
						.eq('id', b.id);

					// Record refund
					const stripeRefundId = `re_mock_${Math.random().toString(36).substring(2, 15)}`;
					await supabaseAdmin
						.from('payment_records')
						.insert({
							booking_id: b.id,
							stripe_payment_intent_id: stripeRefundId,
							amount: 50.00, // Positive amount to satisfy DB constraints
							status: 'refunded'
						});

					// Send refund notifications to customer
					const customer = (b as any).customers;
					if (customer) {
						await sendNotification(
							'matching_timeout',
							{ email: customer.email, phone: customer.phone, name: customer.name },
							{
								trip_date: trip.date,
								trip_type: tripDetails?.trip_type || ''
							}
						);
					}
				}
			}

			return { status: 'timeout_enforced', tripInstanceId };
		});

		return result;
	}
);

// Export all functions as an array for the serve handler
export const functions = [helloWorld, reconfirmBookingWorkflow, captainMatchingWorkflow];
