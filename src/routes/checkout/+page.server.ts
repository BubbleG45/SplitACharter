import { error, fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { inngest } from '$lib/inngest/client';
import { sendNotification } from '$lib/notifications';
import { initiateAccountLinking } from '$lib/account_linking';
import { createStripePaymentIntent, getStripeClient } from '$lib/server/stripe';
import { confirmTripAndTriggerCaptainBlast } from '$lib/server/trips';
import type { PageServerLoad, Actions } from './$types';

async function findOrCreateTripInstanceForGroup(
	templateId: string,
	date: string,
	groupSize: number,
	maxPassengers: number,
	referringCaptainId?: string | null
): Promise<string> {
	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	// Fetch all open/half-booked trip instances for this date
	const { data: candidateTrips } = await supabaseAdmin
		.from('trip_instances')
		.select('id, status')
		.eq('listing_template_id', templateId)
		.eq('date', date)
		.in('status', ['open', 'half-booked']);

	if (candidateTrips && candidateTrips.length > 0) {
		for (const trip of candidateTrips) {
			const { data: bookings } = await supabaseAdmin
				.from('bookings')
				.select('group_size')
				.eq('trip_instance_id', trip.id)
				.in('status', ['paid', 'reconfirmed']);

			const currentlyBooked = bookings?.reduce((sum, b) => sum + b.group_size, 0) || 0;
			const remainingSeats = maxPassengers - currentlyBooked;

			if (remainingSeats >= groupSize) {
				if (referringCaptainId) {
					try {
						// Set primary referring_captain_id if null
						await supabaseAdmin
							.from('trip_instances')
							.update({ referring_captain_id: referringCaptainId })
							.eq('id', trip.id)
							.is('referring_captain_id', null);

						// Append referringCaptainId to referring_captain_ids array if not present
						const { data: currentTripData } = await supabaseAdmin
							.from('trip_instances')
							.select('referring_captain_ids')
							.eq('id', trip.id)
							.maybeSingle();

						const existingIds: string[] = currentTripData?.referring_captain_ids || [];
						if (!existingIds.includes(referringCaptainId)) {
							const updatedIds = [...existingIds, referringCaptainId];
							await supabaseAdmin
								.from('trip_instances')
								.update({ referring_captain_ids: updatedIds })
								.eq('id', trip.id);
						}
					} catch (err: any) {
						console.warn('Non-fatal error updating referring captain IDs on trip_instances:', err?.message || err);
					}
				}
				return trip.id;
			}
		}
	}

	// If no existing instance has enough open seats for this group, spawn a fresh open trip instance
	const insertTrip: any = {
		listing_template_id: templateId,
		date,
		status: 'open'
	};
	if (referringCaptainId) {
		insertTrip.referring_captain_id = referringCaptainId;
		insertTrip.referring_captain_ids = [referringCaptainId];
	}

	let newTrip: any = null;
	let tripCreateError: any = null;

	const { data: initialTrip, error: initialErr } = await supabaseAdmin
		.from('trip_instances')
		.insert(insertTrip)
		.select('id')
		.single();

	newTrip = initialTrip;
	tripCreateError = initialErr;

	// Defensive fallback: If DB schema cache lacks referring_captain_ids or referring_captain_id columns, try fallback inserts
	if (tripCreateError && referringCaptainId && tripCreateError.message?.includes('referring_captain')) {
		console.warn('Fallback insert trip_instances without referring captain columns:', tripCreateError.message);
		delete insertTrip.referring_captain_ids;
		const fallback1 = await supabaseAdmin
			.from('trip_instances')
			.insert(insertTrip)
			.select('id')
			.single();

		if (fallback1.error && fallback1.error.message?.includes('referring_captain_id')) {
			delete insertTrip.referring_captain_id;
			const fallback2 = await supabaseAdmin
				.from('trip_instances')
				.insert(insertTrip)
				.select('id')
				.single();
			newTrip = fallback2.data;
			tripCreateError = fallback2.error;
		} else {
			newTrip = fallback1.data;
			tripCreateError = fallback1.error;
		}
	}

	if (tripCreateError || !newTrip) {
		throw new Error(tripCreateError?.message || 'Database insert error');
	}

	return newTrip.id;
}

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

	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	// Check if there is an existing TripInstance on this date
	const { data: tripInstances } = await supabaseAdmin
		.from('trip_instances')
		.select('id, status')
		.eq('listing_template_id', templateId)
		.eq('date', date)
		.in('status', ['open', 'half-booked']);

	let isJoiningExisting = false;
	let selectedTripInstanceId: string | null = null;

	if (tripInstances && tripInstances.length > 0) {
		const halfBooked = tripInstances.find(t => t.status === 'half-booked');
		if (halfBooked) {
			selectedTripInstanceId = halfBooked.id;
			isJoiningExisting = true;
		} else {
			selectedTripInstanceId = tripInstances[0].id;
		}
	}

	// Maximum group size per single booking is capped at 4 passengers (or boat capacity)
	const maxAvailablePassengers = Math.min(4, listing.max_passengers);

	// Calculate initial group size from URL parameter if available
	const initialGroupSizeRaw = url.searchParams.get('groupSize');
	let initialGroupSize = initialGroupSizeRaw ? parseInt(initialGroupSizeRaw, 10) : 1;
	if (isNaN(initialGroupSize) || initialGroupSize < 1) initialGroupSize = 1;
	if (maxAvailablePassengers > 0 && initialGroupSize > maxAvailablePassengers) {
		initialGroupSize = maxAvailablePassengers;
	}

	return {
		listing,
		profile,
		date,
		maxAvailablePassengers,
		isJoiningExisting,
		tripInstanceId: selectedTripInstanceId,
		initialGroupSize,
		userEmail: user.email || '',
		publishableKey: PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
	};
};

export const actions: Actions = {
	createIntent: async ({ request, url, locals: { safeGetSession } }) => {
		try {
			const { session, user } = await safeGetSession();
			if (!session || !user) {
				return fail(401, { message: 'Unauthorized. Please sign in.' });
			}

			const formData = await request.formData();
			const templateId = (formData.get('templateId') as string) || (url.searchParams.get('templateId') as string);
			const date = (formData.get('date') as string) || (url.searchParams.get('date') as string);
			const name = formData.get('name') as string;
			const phone = formData.get('phone') as string;
			const submittedEmail = (formData.get('email') as string)?.trim();
			const emailToUse = submittedEmail || user.email || '';
			const groupSize = parseInt(formData.get('group_size') as string, 10);
			const commitment = formData.get('commitment') === 'true';
			const liability = formData.get('liability') === 'true';

			if (!name || !phone || !emailToUse) {
				return fail(400, { message: 'Profile details (name, email, and phone) are required.' });
			}
			if (!commitment || !liability) {
				return fail(400, { message: 'You must agree to the booking commitments and liability disclaimer.' });
			}
			if (isNaN(groupSize) || groupSize <= 0) {
				return fail(400, { message: 'Invalid group size.' });
			}

			const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

			// Check for account suspension
			const { data: flaggedMatch } = await supabaseAdmin
				.from('customers')
				.select('id')
				.or(`id.eq.${user.id},email.eq.${emailToUse},phone.eq.${phone}`)
				.or('flagged.eq.true,strike_count.gte.3')
				.limit(1)
				.maybeSingle();

			if (flaggedMatch) {
				return fail(400, { message: 'Booking blocked. Account suspended due to strikes or flagging.' });
			}

			// Create Stripe PaymentIntent for $50.00
			const intentResult = await createStripePaymentIntent({
				amountInCents: 5000,
				customerEmail: emailToUse,
				customerName: name,
				metadata: {
					user_id: user.id,
					template_id: templateId,
					date,
					group_size: String(groupSize)
				}
			});

			return {
				success: true,
				clientSecret: intentResult.clientSecret,
				paymentIntentId: intentResult.paymentIntentId
			};
		} catch (err: any) {
			console.error('Error creating Stripe payment intent:', err);
			return fail(500, { message: err?.message || 'Failed to initialize Stripe PaymentIntent' });
		}
	},
	checkout: async ({ request, url, locals: { safeGetSession } }) => {
		try {
			let accountLinkingTriggered = false;
			const { session, user } = await safeGetSession();

			if (!session || !user) {
				return fail(401, { message: 'Unauthorized. Please sign in.' });
			}

			const formData = await request.formData();
			const templateId = (formData.get('templateId') as string) || (url.searchParams.get('templateId') as string);
			const date = (formData.get('date') as string) || (url.searchParams.get('date') as string);

			if (!templateId || !date) {
				return fail(400, { message: 'Invalid or missing charter listing or date.' });
			}

			// Customer Profile Details
			const name = formData.get('name') as string;
			const phone = formData.get('phone') as string;
			const submittedEmail = (formData.get('email') as string)?.trim();
			const emailToUse = submittedEmail || user.email || '';
			const smsOptIn = formData.get('sms_opt_in') === 'true';
			const howHeard = formData.get('how_heard') as string;
			const referralPromoCode = (formData.get('referral_promo_code') as string)?.trim()?.toUpperCase();

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
			if (!name || !phone || !emailToUse || !howHeard) {
				return fail(400, { message: 'Profile details (including email and phone) are required.' });
			}
			if (!commitment || !liability) {
				return fail(400, { message: 'You must agree to the booking commitments and liability disclaimer.' });
			}
			if (isNaN(groupSize) || groupSize <= 0) {
				return fail(400, { message: 'Invalid group size.' });
			}

			// Instantiate service role admin client to bypass RLS write restrictions
			const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

			// Look up referring captain if referral promo code was provided
			let referringCaptainId: string | null = null;
			if (referralPromoCode) {
				try {
					const { data: captainMatch } = await supabaseAdmin
						.from('captains')
						.select('id, locations, trip_types')
						.ilike('referral_promo_code', referralPromoCode)
						.eq('active', true)
						.maybeSingle();

					if (captainMatch) {
						// Fetch listing details to verify captain covers location and trip type
						const { data: listingMatch } = await supabaseAdmin
							.from('listing_templates')
							.select('location, trip_type')
							.eq('id', templateId)
							.maybeSingle();

						if (listingMatch) {
							const captainLocations = (captainMatch.locations || []).map((l: string) => l.toLowerCase().trim());
							const captainTripTypes = (captainMatch.trip_types || []).map((t: string) => t.toLowerCase().trim());
							const listingLoc = listingMatch.location.toLowerCase().trim();
							const listingType = listingMatch.trip_type.toLowerCase().trim();

							const matchesLocation = captainLocations.some((loc: string) => loc.includes(listingLoc) || listingLoc.includes(loc));
							const matchesTripType = captainTripTypes.some((tt: string) => tt.includes(listingType) || listingType.includes(tt));

							if (matchesLocation && matchesTripType) {
								referringCaptainId = captainMatch.id;
							} else {
								console.info(`Captain promo code '${referralPromoCode}' ignored: does not cover location (${listingMatch.location}) or trip type (${listingMatch.trip_type}).`);
							}
						} else {
							referringCaptainId = captainMatch.id;
						}
					} else {
						console.info(`Captain promo code '${referralPromoCode}' ignored: code invalid or captain inactive.`);
					}
				} catch (promoErr) {
					console.warn('Non-fatal error resolving captain promo code:', promoErr);
				}
			}

			// Check if the current user profile, email, or phone is flagged or suspended
			const { data: flaggedMatch, error: flaggedErr } = await supabaseAdmin
				.from('customers')
				.select('id, name, flagged, strike_count')
				.or(`id.eq.${user.id},email.eq.${emailToUse},phone.eq.${phone}`)
				.or('flagged.eq.true,strike_count.gte.3')
				.limit(1)
				.maybeSingle();

			if (flaggedErr) {
				console.error('Error checking customer suspension status:', flaggedErr);
			}

			if (flaggedMatch) {
				return fail(400, { message: 'Booking blocked. This customer account has been suspended due to strikes or flagging.' });
			}

			// Check for Account Linking collision (if user signed in via SMS and enters an existing Email user's email address)
			accountLinkingTriggered = false;
			let customerRecordEmail = emailToUse;

			if (emailToUse && (!user.email || user.email.toLowerCase() !== emailToUse.toLowerCase())) {
				const { data: existingCust } = await supabaseAdmin
					.from('customers')
					.select('id')
					.ilike('email', emailToUse)
					.neq('id', user.id)
					.maybeSingle();

				let primaryUserId = existingCust?.id;

				if (!primaryUserId) {
					try {
						const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
						const matchedAuthUser = authUsers?.users?.find(
							(u) => u.id !== user.id && u.email?.toLowerCase() === emailToUse.toLowerCase()
						);
						if (matchedAuthUser) {
							primaryUserId = matchedAuthUser.id;
						}
					} catch (authListErr) {
						console.error('Error checking auth.users for existing email:', authListErr);
					}
				}

				if (primaryUserId) {
					// Found an existing account with this email! Trigger verification link
					await initiateAccountLinking({
						primaryUserId,
						secondaryUserId: user.id,
						email: emailToUse,
						phone,
						origin: url.origin
					});
					accountLinkingTriggered = true;
					// Use temporary placeholder email on customer record to avoid UNIQUE constraint violation before merge
					customerRecordEmail = `unlinked_${user.id}@temp.splitacharter.boats`;
				}
			}

			// Fetch Listing details
			const { data: listing, error: listingErr } = await supabaseAdmin
				.from('listing_templates')
				.select('trip_type, max_passengers')
				.eq('id', templateId)
				.maybeSingle();

			if (listingErr || !listing) {
				console.error('Error fetching listing template:', listingErr);
				return fail(400, { message: 'Invalid listing template ID.' });
			}

			const isScubaTrip = listing.trip_type.toLowerCase().includes('scuba');
			if (isScubaTrip) {
				if (
					!certFields ||
					typeof certFields !== 'object' ||
					!certFields.level?.trim() ||
					!certFields.agency?.trim()
				) {
					return fail(400, { message: 'SCUBA Certification Level and Agency are required for Scuba Diving charters.' });
				}
			}

			// 1. Upsert Customer Profile inline
			const { error: profileError } = await supabaseAdmin
				.from('customers')
				.upsert({
					id: user.id,
					name,
					email: customerRecordEmail,
					phone,
					sms_opt_in: smsOptIn,
					how_heard: howHeard,
					updated_at: new Date().toISOString()
				});

			if (profileError) {
				console.error('Error saving customer profile:', profileError);
				return fail(500, { message: 'Failed to update profile.' });
			}

			// Validate group size does not exceed max allowed group size (capped at 4 per group signup)
			const maxAllowedGroupSize = Math.min(4, listing.max_passengers);

			if (groupSize < 1 || groupSize > maxAllowedGroupSize) {
				const errorMsg = groupSize > 4
					? 'Group signups are capped at 4 passengers to encourage group matching and split charter costs evenly.'
					: `Your passenger group size (${groupSize}) exceeds the maximum capacity (${maxAllowedGroupSize} passengers) for this charter.`;
				return fail(400, { message: errorMsg });
			}

			// Resolve or create a TripInstance that has enough open capacity for this group
			let tripInstanceId: string;
			try {
				tripInstanceId = await findOrCreateTripInstanceForGroup(
					templateId,
					date,
					groupSize,
					listing.max_passengers,
					referringCaptainId
				);
			} catch (err: any) {
				console.error('Error resolving trip instance:', err);
				return fail(500, { message: `Failed to initialize trip instance: ${err.message || 'Database error'}` });
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

			// If the trip instance is half-booked (1 group paid, waiting for group 2), send reservation_pending_match email
			if (nextTripStatus === 'half-booked') {
				try {
					await sendNotification(
						'reservation_pending_match',
						{ email: user.email || '', phone, name },
						{
							trip_date: date,
							trip_type: listing.trip_type
						}
					);
				} catch (notifErr) {
					console.error('Error sending reservation_pending_match notification:', notifErr);
				}
			}

			// If the trip instance is now pending-reconfirm, auto-reconfirm Group 2 and ask Group 1 to reconfirm
			if (nextTripStatus === 'pending-reconfirm') {
				// 1. Auto-reconfirm Group 2 (current checkout customer)
				await supabaseAdmin
					.from('bookings')
					.update({
						status: 'reconfirmed',
						reconfirmation_timestamp: new Date().toISOString()
					})
					.eq('id', booking.id);

				// 2. Set Group 1 (the existing booking) to 'awaiting-reconfirm'
				await supabaseAdmin
					.from('bookings')
					.update({ status: 'awaiting-reconfirm' })
					.eq('trip_instance_id', tripInstanceId)
					.neq('id', booking.id)
					.in('status', ['paid']);

				// 3. Send match_auto_reconfirmed notification to Group 2
				try {
					await sendNotification(
						'match_auto_reconfirmed',
						{ email: user.email || '', phone, name },
						{
							trip_date: date,
							trip_type: listing.trip_type
						}
					);
				} catch (notifErr) {
					console.error('Error sending match_auto_reconfirmed notification:', notifErr);
				}

				// 4. Send match_detected notification ONLY to Group 1
				const { data: firstGroupBookings } = await supabaseAdmin
					.from('bookings')
					.select('id, customers(name, phone, email)')
					.eq('trip_instance_id', tripInstanceId)
					.neq('id', booking.id);

				if (firstGroupBookings) {
					for (const cb of firstGroupBookings) {
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
								console.error('Error sending match_detected notification to group 1:', notifErr);
							}
						}
					}
				}

				// 5. Trigger Inngest reconfirmation timers for Group 1 only, and cancel unmatched timers for Group 2
				try {
					const tripDateTime = `${date}T08:00:00.000Z`; // Default departure 8:00 AM
					const matchTime = new Date().toISOString();

					if (firstGroupBookings && firstGroupBookings.length > 0) {
						await inngest.send(
							firstGroupBookings.map((b) => ({
								name: 'booking/match.detected',
								data: {
									bookingId: b.id,
									tripDateTime,
									matchTime
								}
							}))
						);
					}

					await inngest.send({
						name: 'booking/reconfirmed',
						data: { bookingId: booking.id }
					});
				} catch (inngestErr) {
					console.error('Inngest match.detected / reconfirmed event failed (non-fatal):', inngestErr);
				}

				// 6. Check if BOTH bookings on this trip instance are now reconfirmed
				const { data: allTripBookings } = await supabaseAdmin
					.from('bookings')
					.select('id, status')
					.eq('trip_instance_id', tripInstanceId)
					.not('status', 'in', '("canceled","forfeited")');

				if (allTripBookings && allTripBookings.every((b) => b.status === 'reconfirmed') && allTripBookings.length === 2) {
					await confirmTripAndTriggerCaptainBlast(tripInstanceId);
				}
			}

			if (accountLinkingTriggered) {
				throw redirect(303, '/dashboard?account_linking_sent=true');
			}

			// Redirect to customer dashboard on successful checkout
			throw redirect(303, '/dashboard');
		} catch (err: any) {
			if (err?.status === 303) throw err;
			console.error('Unhandled exception during checkout:', err);
			return fail(500, { message: err?.message || 'An unexpected error occurred during checkout processing.' });
		}
	}
};
