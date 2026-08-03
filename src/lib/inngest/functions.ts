import { inngest } from './client';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { calculateReconfirmSchedule, calculateCaptainPriorityHours } from '../reconfirmation';
import { sendSMS } from '../sms';
import { sendNotification } from '../notifications';
import { env } from '$env/dynamic/private';

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

			// Record the strike in customer_strikes (triggering auto strike_count & flagged sync)
			await supabaseAdmin
				.from('customer_strikes')
				.insert({
					customer_id: booking.customer_id,
					trip_instance_id: booking.trip_instance_id,
					reason: 'Failed to reconfirm booking in window'
				});

			// Mark payment record as forfeited
			await supabaseAdmin
				.from('payment_records')
				.update({ status: 'forfeited' })
				.eq('booking_id', bookingId);

			// Retrieve counterpart bookings on the same trip instance with customer info
			const { data: otherBookings } = await supabaseAdmin
				.from('bookings')
				.select('id, status, customers(name, email, phone)')
				.eq('trip_instance_id', booking.trip_instance_id)
				.neq('id', bookingId);

			// Update counterpart bookings to 'paid' and notify them
			if (otherBookings && otherBookings.length > 0) {
				for (const other of otherBookings) {
					if (other.status === 'reconfirmed' || other.status === 'paid' || other.status === 'awaiting-reconfirm' || other.status === 'held') {
						await supabaseAdmin
							.from('bookings')
							.update({ status: 'paid', reconfirmation_timestamp: null })
							.eq('id', other.id);

						const otherCustomer = (other as any).customers;
						if (otherCustomer) {
							await sendNotification(
								'counterpart_forfeited',
								{ email: otherCustomer.email, phone: otherCustomer.phone, name: otherCustomer.name },
								{ trip_date: tripDateTime.split('T')[0] }
							);
						}
					}
				}
			}

			// Reset TripInstance back to half-booked (holding the confirming group)
			await supabaseAdmin
				.from('trip_instances')
				.update({ status: 'half-booked' })
				.eq('id', booking.trip_instance_id);

			// Query the updated customer record to return the correct count and flag state
			const { data: updatedCustomer } = await supabaseAdmin
				.from('customers')
				.select('strike_count, flagged')
				.eq('id', booking.customer_id)
				.single();

			return {
				status: 'enforced',
				bookingId,
				newStrikeCount: updatedCustomer?.strike_count || 0,
				flagged: !!updatedCustomer?.flagged
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

		// 1. Fetch Trip details including referring captain and eligible captains
		const matchData = await step.run('find-eligible-captains', async () => {
			const { data: trip } = await supabaseAdmin
				.from('trip_instances')
				.select('id, date, referring_captain_id, listing_templates(trip_type, location, meeting_area)')
				.eq('id', tripInstanceId)
				.single();

			if (!trip) {
				return { trip: null, referringCaptain: null, captains: [] };
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
				return { trip, referringCaptain: null, captains: [] };
			}

			// Filter eligible captains
			const eligible = captains.filter((c) =>
				c.trip_types?.includes(tripType) &&
				c.locations?.includes(location)
			);

			let referringCaptain = null;
			if (trip.referring_captain_id) {
				referringCaptain = captains.find((c) => c.id === trip.referring_captain_id) || null;
			}

			return { trip, referringCaptain, captains: eligible };
		});

		if (!matchData.trip) {
			return { status: 'skipped', reason: 'Trip not found' };
		}

		const trip = matchData.trip;
		const tripDetails = (trip as any).listing_templates;
		const baseUrl = env.PUBLIC_SITE_URL || 'http://localhost:5173';

		// 2. Handle Referring Captain Priority Head-Start Window
		if (matchData.referringCaptain && matchData.referringCaptain.phone) {
			const priorityHours = calculateCaptainPriorityHours(
				`${trip.date}T08:00:00.000Z`
			);

			await step.run('dispatch-referring-captain-priority-sms', async () => {
				const c = matchData.referringCaptain!;
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
				return { status: 'priority_sms_sent', captainId: c.id, priorityHours };
			});

			// Sleep for the priority duration before opening blast to all remaining captains
			const priorityDurationMs = Math.round(priorityHours * 60 * 60 * 1000);
			await step.sleep('wait-referring-captain-priority-window', priorityDurationMs);
		}

		// 3. Dispatch simultaneous SMS blast to all matching captains (if trip is still unmatched)
		await step.run('dispatch-sms-blast', async () => {
			// Check if captain claimed the trip during priority window
			const { data: updatedTrip } = await supabaseAdmin
				.from('trip_instances')
				.select('captain_id')
				.eq('id', tripInstanceId)
				.single();

			if (updatedTrip?.captain_id) {
				return { status: 'already_matched', captain_id: updatedTrip.captain_id };
			}

			const captains = matchData.captains;
			if (captains.length === 0) {
				console.log(`[Captain Blast] No eligible captains found for trip ${tripInstanceId}`);
				return { status: 'no_captains' };
			}

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

		// 4. Sleep until 24 hours before trip departure date
		const tripDate = matchData.trip.date;
		const deadlineDate = new Date(`${tripDate}T08:00:00.000Z`);
		const matchingTimeoutTime = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000);

		await step.sleepUntil('sleep-until-notice-deadline', matchingTimeoutTime);

		// 5. Enforce timeout if no captain matched in time
		const result = await step.run('enforce-timeout', async () => {
			const { data: trip } = await supabaseAdmin
				.from('trip_instances')
				.select('id, captain_id, date, listing_templates(trip_type, meeting_area)')
				.eq('id', tripInstanceId)
				.single();

			if (!trip) {
				return { status: 'skipped', reason: 'Trip not found' };
			}

			if (trip.captain_id) {
				return { status: 'skipped', reason: 'Captain was successfully matched' };
			}

			await supabaseAdmin
				.from('trip_instances')
				.update({ status: 'canceled' })
				.eq('id', tripInstanceId);

			const { data: bookings } = await supabaseAdmin
				.from('bookings')
				.select('id, customer_id, customers(name, phone, email)')
				.eq('trip_instance_id', tripInstanceId)
				.not('status', 'in', '("canceled","forfeited")');

			if (bookings && bookings.length > 0) {
				const tripDetails = (trip as any).listing_templates;

				for (const b of bookings) {
					await supabaseAdmin
						.from('bookings')
						.update({ status: 'canceled' })
						.eq('id', b.id);

					const stripeRefundId = `re_mock_${Math.random().toString(36).substring(2, 15)}`;
					await supabaseAdmin
						.from('payment_records')
						.insert({
							booking_id: b.id,
							stripe_payment_intent_id: stripeRefundId,
							amount: 50.00,
							status: 'refunded'
						});

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

// Half-Booked Upgrade Prompts Workflow (72h and 48h pre-trip buyout prompts for Group 1)
export const halfBookedUpgradeWorkflow = inngest.createFunction(
	{
		id: 'half-booked-upgrade-workflow',
		name: 'Half Booked Upgrade Prompts Workflow',
		triggers: [{ event: 'trip/half-booked.created' }],
		cancelOn: [
			{
				event: 'trip/match.detected',
				match: 'data.tripInstanceId'
			},
			{
				event: 'trip/cancelled',
				match: 'data.tripInstanceId'
			}
		]
	},
	async ({ event, step }) => {
		const { tripInstanceId, tripDateTime } = event.data;
		const departureDate = new Date(tripDateTime);

		// 1. Sleep until 72 hours before departure for 1st upgrade prompt
		const prompt72hTime = new Date(departureDate.getTime() - 72 * 60 * 60 * 1000);
		if (prompt72hTime.getTime() > Date.now()) {
			await step.sleepUntil('sleep-until-72h-upgrade-prompt', prompt72hTime);
			await step.run('send-72h-upgrade-prompt', async () => {
				const { data: trip } = await supabaseAdmin
					.from('trip_instances')
					.select('id, status, date, listing_templates(trip_type)')
					.eq('id', tripInstanceId)
					.single();

				if (trip && trip.status === 'half-booked') {
					const { data: bookings } = await supabaseAdmin
						.from('bookings')
						.select('id, customers(name, phone, email)')
						.eq('trip_instance_id', tripInstanceId)
						.eq('status', 'paid');

					for (const b of bookings || []) {
						const customer = (b as any).customers;
						if (customer) {
							await sendNotification(
								'reservation_pending_match',
								{ email: customer.email, phone: customer.phone, name: customer.name },
								{
									trip_date: trip.date,
									trip_type: (trip as any).listing_templates?.trip_type || ''
								}
							);
						}
					}
				}
			});
		}

		// 2. Sleep until 48 hours before departure for final 48h upgrade prompt
		const prompt48hTime = new Date(departureDate.getTime() - 48 * 60 * 60 * 1000);
		if (prompt48hTime.getTime() > Date.now()) {
			await step.sleepUntil('sleep-until-48h-upgrade-prompt', prompt48hTime);
			await step.run('send-48h-upgrade-prompt', async () => {
				const { data: trip } = await supabaseAdmin
					.from('trip_instances')
					.select('id, status, date, listing_templates(trip_type)')
					.eq('id', tripInstanceId)
					.single();

				if (trip && trip.status === 'half-booked') {
					const { data: bookings } = await supabaseAdmin
						.from('bookings')
						.select('id, customers(name, phone, email)')
						.eq('trip_instance_id', tripInstanceId)
						.eq('status', 'paid');

					for (const b of bookings || []) {
						const customer = (b as any).customers;
						if (customer) {
							await sendNotification(
								'reservation_pending_match',
								{ email: customer.email, phone: customer.phone, name: customer.name },
								{
									trip_date: trip.date,
									trip_type: (trip as any).listing_templates?.trip_type || ''
								}
							);
						}
					}
				}
			});
		}

		return { status: 'upgrade_prompts_completed', tripInstanceId };
	}
);

// Unmatched Trip Timeout Workflow (when a group registers but no match is found before departure date)
export const unmatchedTripTimeoutWorkflow = inngest.createFunction(
	{
		id: 'unmatched-trip-timeout-workflow',
		name: 'Unmatched Trip Timeout Workflow',
		triggers: [{ event: 'booking/unmatched.timeout.schedule' }],
		cancelOn: [
			{
				event: 'trip/confirmed',
				match: 'data.tripInstanceId'
			},
			{
				event: 'booking/cancelled',
				match: 'data.bookingId'
			}
		]
	},
	async ({ event, step }) => {
		const { bookingId, tripInstanceId, tripDateTime } = event.data;

		// Sleep until 24 hours before trip departure date
		const departureDate = new Date(tripDateTime);
		const timeoutTime = new Date(departureDate.getTime() - 24 * 60 * 60 * 1000);

		await step.sleepUntil('sleep-until-notice-deadline', timeoutTime);

		const result = await step.run('check-and-enforce-unmatched-timeout', async () => {
			const { data: booking, error: bookingErr } = await supabaseAdmin
				.from('bookings')
				.select('id, status, customer_id, customers(name, phone, email)')
				.eq('id', bookingId)
				.single();

			if (bookingErr || !booking) {
				return { status: 'skipped', reason: 'Booking not found' };
			}

			// If the booking is already confirmed, canceled, or forfeited, do nothing
			if (booking.status === 'reconfirmed' || booking.status === 'canceled' || booking.status === 'forfeited') {
				return { status: 'skipped', reason: `Booking is in state: ${booking.status}` };
			}

			// Check if the trip is unmatched (open or half-booked status, no captain)
			const { data: trip } = await supabaseAdmin
				.from('trip_instances')
				.select('id, status, date, listing_templates(trip_type)')
				.eq('id', tripInstanceId)
				.single();

			if (!trip || trip.status === 'confirmed' || trip.status === 'completed') {
				return { status: 'skipped', reason: `Trip is in status: ${trip?.status}` };
			}

			// Cancel the booking and the trip instance
			await supabaseAdmin
				.from('bookings')
				.update({ status: 'canceled' })
				.eq('id', bookingId);

			await supabaseAdmin
				.from('trip_instances')
				.update({ status: 'canceled' })
				.eq('id', tripInstanceId);

			// Record refund
			const stripeRefundId = `re_mock_unmatched_${Math.random().toString(36).substring(2, 15)}`;
			await supabaseAdmin
				.from('payment_records')
				.insert({
					booking_id: bookingId,
					stripe_payment_intent_id: stripeRefundId,
					amount: 50.00, // Positive amount to satisfy DB constraints
					status: 'refunded'
				});

			// Send notification to customer
			const customer = (booking as any).customers;
			const tripDetails = (trip as any).listing_templates;
			if (customer) {
				await sendNotification(
					'unmatched_trip_timeout',
					{ email: customer.email, phone: customer.phone, name: customer.name },
					{
						trip_date: trip.date,
						trip_type: tripDetails?.trip_type || ''
					}
				);
			}

			return { status: 'unmatched_timeout_enforced', bookingId, tripInstanceId };
		});

		return result;
	}
);

// Export all functions as an array for the serve handler
export const functions = [helloWorld, reconfirmBookingWorkflow, captainMatchingWorkflow, halfBookedUpgradeWorkflow, unmatchedTripTimeoutWorkflow];

