import { error, fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { inngest } from '$lib/inngest/client';
import { sendNotification } from '$lib/notifications';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url, locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
	}

	const templateId = url.searchParams.get('templateId');
	const date = url.searchParams.get('date');

	if (!templateId || !date) {
		throw redirect(303, '/browse');
	}

	// Fetch Listing Template
	const { data: listing, error: listingError } = await supabase
		.from('listing_templates')
		.select('*')
		.eq('id', templateId)
		.eq('active', true)
		.maybeSingle();

	if (listingError || !listing) {
		throw error(404, 'Listing template not found');
	}

	// Fetch Customer Profile
	const { data: profile } = await supabase
		.from('customers')
		.select('*')
		.eq('id', user.id)
		.maybeSingle();

	// Check if there is an existing TripInstance on this date
	const { data: tripInstance } = await supabase
		.from('trip_instances')
		.select('id, status')
		.eq('listing_template_id', templateId)
		.eq('date', date)
		.in('status', ['open', 'half-booked'])
		.maybeSingle();

	// Calculate maximum group size for this booking
	let maxAvailablePassengers = listing.max_passengers;
	let isJoiningExisting = false;

	if (tripInstance && tripInstance.status === 'half-booked') {
		isJoiningExisting = true;
		
		// Sum up group size of existing bookings on this trip instance
		const { data: existingBookings } = await supabase
			.from('bookings')
			.select('group_size')
			.eq('trip_instance_id', tripInstance.id)
			.not('status', 'in', '("canceled","forfeited")');

		const currentlyBooked = existingBookings?.reduce((sum, b) => sum + b.group_size, 0) || 0;
		maxAvailablePassengers = listing.max_passengers - currentlyBooked;
	}

	return {
		listing,
		profile,
		date,
		maxAvailablePassengers,
		isJoiningExisting,
		tripInstanceId: tripInstance?.id || null
	};
};

export const actions: Actions = {
	checkout: async ({ request, url, locals: { safeGetSession } }) => {
		try {
			const { session, user } = await safeGetSession();

			if (!session || !user) {
				return fail(401, { message: 'Unauthorized. Please sign in.' });
			}

			const formData = await request.formData();
			const templateId = (formData.get('templateId') as string) || (url.searchParams.get('templateId') as string);
			const date = (formData.get('date') as string) || (url.searchParams.get('date') as string);

			// Customer Profile Details
			const name = formData.get('name') as string;
			const phone = formData.get('phone') as string;
			const smsOptIn = formData.get('sms_opt_in') === 'true';
			const howHeard = formData.get('how_heard') as string;

			// Booking Details
			const groupSize = parseInt(formData.get('group_size') as string, 10);
			const certFieldsRaw = formData.get('certification_fields') as string;
			const commitment = formData.get('commitment') === 'true';
			const liability = formData.get('liability') === 'true';

			let certFields = null;
			if (certFieldsRaw) {
				try {
					certFields = JSON.parse(certFieldsRaw);
				} catch (e) {
					console.error('Error parsing certification fields:', e);
				}
			}

			// Profile and Agreement Validations
			if (!name || !phone || !howHeard) {
				return fail(400, { message: 'Profile details are required.' });
			}
			if (!commitment || !liability) {
				return fail(400, { message: 'You must agree to the booking commitments and liability disclaimer.' });
			}
			if (isNaN(groupSize) || groupSize <= 0) {
				return fail(400, { message: 'Invalid group size.' });
			}

			// Instantiate service role admin client to bypass RLS write restrictions
			const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

			// Check if the current user profile, email, or phone is flagged or suspended
			const { data: flaggedMatch, error: flaggedErr } = await supabaseAdmin
				.from('customers')
				.select('id, name, flagged, strike_count')
				.or(`id.eq.${user.id},email.eq.${user.email || ''},phone.eq.${phone}`)
				.or('flagged.eq.true,strike_count.gte.3')
				.limit(1)
				.maybeSingle();

			if (flaggedErr) {
				console.error('Error checking customer suspension status:', flaggedErr);
			}

			if (flaggedMatch) {
				return fail(400, { message: 'Booking blocked. This customer account has been suspended due to strikes or flagging.' });
			}

			// Fetch Listing details
			const { data: listing, error: listingErr } = await supabaseAdmin
				.from('listing_templates')
				.select('trip_type')
				.eq('id', templateId)
				.maybeSingle();

			if (listingErr || !listing) {
				console.error('Error fetching listing template:', listingErr);
				return fail(400, { message: 'Invalid listing template ID.' });
			}

			// 1. Upsert Customer Profile inline
			const { error: profileError } = await supabaseAdmin
				.from('customers')
				.upsert({
					id: user.id,
					name,
					email: user.email || '',
					phone,
					sms_opt_in: smsOptIn,
					how_heard: howHeard,
					updated_at: new Date().toISOString()
				});

			if (profileError) {
				console.error('Error saving customer profile:', profileError);
				return fail(500, { message: 'Failed to update profile.' });
			}

			// 2. Resolve TripInstance
			let tripInstanceId = formData.get('tripInstanceId') as string;
			
			// Double check or create TripInstance
			if (!tripInstanceId) {
				const { data: existingTrip } = await supabaseAdmin
					.from('trip_instances')
					.select('id')
					.eq('listing_template_id', templateId)
					.eq('date', date)
					.in('status', ['open', 'half-booked'])
					.maybeSingle();

				if (existingTrip) {
					tripInstanceId = existingTrip.id;
				} else {
					const { data: newTrip, error: tripCreateError } = await supabaseAdmin
						.from('trip_instances')
						.insert({
							listing_template_id: templateId,
							date,
							status: 'open'
						})
						.select('id')
						.single();

					if (tripCreateError) {
						console.error('Error creating trip instance:', tripCreateError);
						return fail(500, { message: 'Failed to initialize trip instance.' });
					}
					tripInstanceId = newTrip.id;
				}
			}

			// 3. Create Booking in 'pending-payment' status
			const { data: booking, error: bookingError } = await supabaseAdmin
				.from('bookings')
				.insert({
					trip_instance_id: tripInstanceId,
					customer_id: user.id,
					group_size: groupSize,
					status: 'pending-payment',
					certification_fields: certFields
				})
				.select('id')
				.single();

			if (bookingError) {
				console.error('Error creating booking:', bookingError.message);
				return fail(400, { message: bookingError.message || 'Failed to create booking. Capacity may have been exceeded.' });
			}

			// 4. Handle Mock/Real payment success (for development, we simulate success)
			const amount = 50.00; // Phase 1 reservation deposit
			const paymentOutcome = formData.get('payment_outcome') as string;

			if (paymentOutcome === 'fail') {
				const stripePaymentIntentId = `pi_failed_${Math.random().toString(36).substring(2, 15)}`;
				await supabaseAdmin
					.from('payment_records')
					.insert({
						booking_id: booking.id,
						stripe_payment_intent_id: stripePaymentIntentId,
						amount,
						status: 'failed'
					});
				return fail(402, { message: 'Payment Declined: The sandbox card has insufficient funds or was rejected by the bank.' });
			}

			const stripePaymentIntentId = `pi_mock_${Math.random().toString(36).substring(2, 15)}`;

			const { error: payRecordError } = await supabaseAdmin
				.from('payment_records')
				.insert({
					booking_id: booking.id,
					stripe_payment_intent_id: stripePaymentIntentId,
					amount,
					status: 'succeeded'
				});

			if (payRecordError) {
				console.error('Error inserting payment record:', payRecordError);
			}

			// 5. Transition booking status to paid
			const { error: bookingUpdateError } = await supabaseAdmin
				.from('bookings')
				.update({ status: 'paid' })
				.eq('id', booking.id);

			if (bookingUpdateError) {
				console.error('Error updating booking status:', bookingUpdateError);
				return fail(500, { message: 'Failed to finalize booking payment state.' });
			}

			// Trigger unmatched trip timeout scheduler for this booking
			try {
				const tripDateTime = `${date}T08:00:00.000Z`; // Default departure 8:00 AM
				await inngest.send({
					name: 'booking/unmatched.timeout.schedule',
					data: {
						bookingId: booking.id,
						tripInstanceId,
						tripDateTime
					}
				});
			} catch (inngestErr) {
				console.error('Inngest unmatched timeout schedule failed (non-fatal):', inngestErr);
			}

			// 6. Resolve TripInstance status based on new paid bookings count
			const { data: paidBookings } = await supabaseAdmin
				.from('bookings')
				.select('id')
				.eq('trip_instance_id', tripInstanceId)
				.in('status', ['paid', 'awaiting-reconfirm', 'reconfirmed', 'held']);

			const paidCount = paidBookings?.length || 0;
			let nextTripStatus = 'open';
			if (paidCount === 1) {
				nextTripStatus = 'half-booked';
			} else if (paidCount === 2) {
				nextTripStatus = 'pending-reconfirm';
			}

			const { error: tripUpdateError } = await supabaseAdmin
				.from('trip_instances')
				.update({ status: nextTripStatus })
				.eq('id', tripInstanceId);

			if (tripUpdateError) {
				console.error('Error updating trip instance status:', tripUpdateError);
			}

			// If the trip instance is now pending-reconfirm, transition bookings and start Inngest reconfirmation timers
			if (nextTripStatus === 'pending-reconfirm') {
				const { data: matchedBookings } = await supabaseAdmin
					.from('bookings')
					.select('id')
					.eq('trip_instance_id', tripInstanceId)
					.in('status', ['paid', 'awaiting-reconfirm']);

				if (matchedBookings && matchedBookings.length >= 2) {
					const bookingIds = matchedBookings.map((b) => b.id);

					// Update both bookings status to 'awaiting-reconfirm'
					await supabaseAdmin
						.from('bookings')
						.update({ status: 'awaiting-reconfirm' })
						.in('id', bookingIds);

					// Trigger match_detected notifications immediately to both customers
					const { data: customerBookings } = await supabaseAdmin
						.from('bookings')
						.select('id, customers(name, phone, email)')
						.in('id', bookingIds);

					if (customerBookings) {
						for (const cb of customerBookings) {
							const customer = (cb as any).customers;
							if (customer) {
								try {
									await sendNotification(
										'match_detected',
										{ email: customer.email, phone: customer.phone, name: customer.name },
										{
											trip_date: date,
											trip_type: listing.trip_type
										}
									);
								} catch (notifErr) {
									console.error('Error sending match_detected notification:', notifErr);
								}
							}
						}
					}

					// Trigger Inngest match.detected event for each booking
					try {
						const tripDateTime = `${date}T08:00:00.000Z`; // Default departure 8:00 AM
						const matchTime = new Date().toISOString();

						await inngest.send(
							bookingIds.map((id) => ({
								name: 'booking/match.detected',
								data: {
									bookingId: id,
									tripDateTime,
									matchTime
								}
							}))
						);
					} catch (inngestErr) {
						console.error('Inngest match.detected event failed (non-fatal):', inngestErr);
					}
				}
			}
		} catch (err: any) {
			console.error('Unhandled exception during checkout:', err);
			return fail(500, { message: err?.message || 'An unexpected error occurred during checkout processing.' });
		}

		// Redirect to customer dashboard on successful checkout
		throw redirect(303, '/dashboard');
	}
};
