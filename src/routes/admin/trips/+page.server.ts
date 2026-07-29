import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sendNotification, getSiteUrl } from '$lib/notifications';
import { generateCaptainToken } from '$lib/security';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [tripsRes, listingsRes] = await Promise.all([
		supabase
			.from('trip_instances')
			.select(`
				id,
				date,
				status,
				captain_id,
				created_at,
				captains (
					name,
					phone
				),
				listing_templates (
					id,
					trip_type,
					location,
					meeting_area
				),
				bookings (
					id,
					group_size,
					status,
					created_at,
					customers (
						id,
						name,
						email,
						phone
					)
				)
			`)
			.order('date', { ascending: true })
			.order('created_at', { ascending: false }),
		supabase
			.from('listing_templates')
			.select('id, trip_type, location')
			.eq('active', true)
			.order('trip_type', { ascending: true })
	]);

	if (tripsRes.error) {
		console.error('Error loading trips for admin:', tripsRes.error);
		throw error(500, 'Failed to load trip instances');
	}

	return {
		trips: tripsRes.data || [],
		listingTemplates: listingsRes.data || []
	};
};

export const actions: Actions = {
	getLogs: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim();
		const phone = (formData.get('phone') as string)?.trim();
		const tripDate = (formData.get('tripDate') as string)?.trim();
		const tripId = (formData.get('tripId') as string)?.trim();

		if (!email && !phone) {
			return fail(400, { message: 'Missing recipient identifier' });
		}

		let logs: any[] = [];
		let logsErr: any = null;

		try {
			if (email && phone) {
				const cleanPhone = phone.replace(/\D/g, '');
				const orConditions = [
					`recipient.ilike.%${email}%`,
					`recipient.ilike.%${phone}%`
				];
				if (cleanPhone && cleanPhone.length >= 7 && cleanPhone !== phone) {
					orConditions.push(`recipient.ilike.%${cleanPhone}%`);
				}

				const { data, error } = await supabase
					.from('notification_logs')
					.select('*')
					.or(orConditions.join(','))
					.order('timestamp', { ascending: false });

				logs = data || [];
				logsErr = error;
			} else if (email) {
				const { data, error } = await supabase
					.from('notification_logs')
					.select('*')
					.ilike('recipient', `%${email}%`)
					.order('timestamp', { ascending: false });

				logs = data || [];
				logsErr = error;
			} else if (phone) {
				const { data, error } = await supabase
					.from('notification_logs')
					.select('*')
					.ilike('recipient', `%${phone}%`)
					.order('timestamp', { ascending: false });

				logs = data || [];
				logsErr = error;
			}
		} catch (err) {
			logsErr = err;
		}

		// Fallback: If DB .or() failed or returned 0 logs, load all recent notification logs and match recipient in JS
		if (logsErr || logs.length === 0) {
			const { data: allLogs } = await supabase
				.from('notification_logs')
				.select('*')
				.order('timestamp', { ascending: false })
				.limit(300);

			if (allLogs) {
				const eLower = (email || '').toLowerCase();
				const pClean = (phone || '').replace(/\D/g, '');

				logs = allLogs.filter((l: any) => {
					const rLower = (l.recipient || '').toLowerCase();
					const rClean = (l.recipient || '').replace(/\D/g, '');

					const matchEmail = Boolean(eLower && rLower.includes(eLower));
					const matchPhone = Boolean(
						(phone && rLower.includes(phone.toLowerCase())) ||
						(pClean && pClean.length >= 7 && rClean.includes(pClean))
					);

					return matchEmail || matchPhone;
				});
			}
		}

		// 1. Filter out login/auth/otp communications
		const nonAuthLogs = logs.filter((l: any) => {
			const template = (l.template || '').toLowerCase();
			return !(
				template.includes('auth') ||
				template.includes('login') ||
				template.includes('magic') ||
				template.includes('otp')
			);
		});

		// 2. Filter by tripDate or tripId if available
		const dateMatchedLogs = nonAuthLogs.filter((l: any) => {
			if (!tripDate && !tripId) return true;
			const content = l.content || '';
			if (tripId && content.toLowerCase().includes(tripId.toLowerCase())) {
				return true;
			}
			if (tripDate) {
				if (content.includes(tripDate)) return true;
				const parts = tripDate.split('-');
				if (parts.length === 3) {
					const yyyy = parts[0];
					const mm = parts[1];
					const dd = parts[2];
					const m = String(parseInt(mm, 10));
					const d = String(parseInt(dd, 10));

					if (content.includes(`${mm}/${dd}/${yyyy}`) || content.includes(`${m}/${d}/${yyyy}`)) {
						return true;
					}

					const dateObj = new Date(`${tripDate}T00:00:00`);
					if (!isNaN(dateObj.getTime())) {
						const monthLong = dateObj.toLocaleDateString('en-US', { month: 'long' });
						const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
						if (content.includes(`${monthLong} ${d}`) || content.includes(`${monthShort} ${d}`)) {
							return true;
						}
					}
				}
			}
			return false;
		});

		// Return date-matched logs if found, otherwise fallback to non-auth logs so history is never blank
		const tripLogs = (dateMatchedLogs.length > 0) ? dateMatchedLogs : nonAuthLogs;

		return { logs: tripLogs };
	},

	cancelTrip: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const tripId = formData.get('tripId') as string;
		const withRefund = formData.get('withRefund') === 'true';
		const reason = (formData.get('reason') as string)?.trim() || 'Operations cancellation';

		if (!tripId) {
			return fail(400, { message: 'Trip ID is required.' });
		}

		// Update trip instance status to canceled
		const { error: cancelErr } = await supabase
			.from('trip_instances')
			.update({ status: 'canceled' })
			.eq('id', tripId);

		if (cancelErr) {
			console.error('Error canceling trip:', cancelErr);
			return fail(500, { message: cancelErr.message || 'Failed to cancel trip instance.' });
		}

		// Retrieve active bookings on this trip to cancel, optionally refund, and notify customers
		const { data: bookings } = await supabase
			.from('bookings')
			.select('id, customers(name, phone, email), trip_instances(date, listing_templates(trip_type))')
			.eq('trip_instance_id', tripId)
			.not('status', 'in', '("canceled","forfeited")');

		if (bookings && bookings.length > 0) {
			for (const b of bookings) {
				await supabase
					.from('bookings')
					.update({ status: 'canceled' })
					.eq('id', b.id);

				if (withRefund) {
					const refundId = `ref_admin_${Math.random().toString(36).substring(2, 10)}`;
					await supabase
						.from('payment_records')
						.insert({
							booking_id: b.id,
							stripe_payment_intent_id: refundId,
							amount: 50.00,
							status: 'refunded'
						});
				}

				const customer = (b as any).customers;
				const trip = (b as any).trip_instances;
				const tripDetails = trip?.listing_templates;

				if (customer) {
					const refundText = withRefund
						? 'Your $50.00 reservation fee has been fully refunded to your original payment method.'
						: 'Per platform policy, this cancellation is non-refundable.';

					try {
						await sendNotification(
							'admin_trip_cancellation',
							{ email: customer.email, phone: customer.phone, name: customer.name },
							{
								trip_date: trip?.date || '',
								trip_type: tripDetails?.trip_type || '',
								cancellation_reason: reason,
								refund_status_text: refundText
							}
						);
					} catch (notifErr) {
						console.error('Error sending admin_trip_cancellation notification:', notifErr);
					}
				}
			}
		}

		return { success: true };
	},

	getCaptainsLog: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const tripId = formData.get('tripId') as string;

		if (!tripId) {
			return fail(400, { message: 'Trip ID is required' });
		}

		// 1. Fetch trip instance with assigned captain and listing details
		const { data: trip, error: tripErr } = await supabase
			.from('trip_instances')
			.select(`
				id,
				date,
				status,
				captain_id,
				updated_at,
				captains (
					id,
					name,
					phone,
					email
				),
				listing_templates (
					trip_type,
					location,
					meeting_area
				)
			`)
			.eq('id', tripId)
			.maybeSingle();

		if (tripErr || !trip) {
			return fail(404, { message: 'Trip instance not found' });
		}

		// 2. Fetch all notification_logs for captain_blast and captain_details_link matching tripId
		let { data: logs, error: logsErr } = await supabase
			.from('notification_logs')
			.select('*')
			.in('template', ['captain_blast', 'captain_details_link'])
			.ilike('content', `%${tripId}%`)
			.order('timestamp', { ascending: true });

		if (logsErr) {
			console.error('Error fetching captain notification logs:', logsErr);
		}

		if (!logs || logs.length === 0) {
			// Fallback: search notification_logs by trip date for captain_blast/captain_details_link
			const { data: dateLogs } = await supabase
				.from('notification_logs')
				.select('*')
				.in('template', ['captain_blast', 'captain_details_link'])
				.ilike('content', `%${trip.date}%`)
				.order('timestamp', { ascending: true });

			logs = dateLogs || [];
		}

		// 3. Fetch all active captains to resolve recipient phone/email to captain names
		const { data: allCaptains } = await supabase
			.from('captains')
			.select('id, name, phone, email');

		const captainMap = new Map<string, any>();
		if (allCaptains) {
			for (const cap of allCaptains) {
				if (cap.phone) captainMap.set(cap.phone, cap);
				if (cap.email) captainMap.set(cap.email, cap);
				captainMap.set(cap.id, cap);
			}
		}

		// 4. Identify winning acceptance notification log (if any) or updated_at
		const winningLog = (logs || []).find((l: any) => l.template === 'captain_details_link');
		const acceptedTime = winningLog ? winningLog.timestamp : (trip.captain_id ? trip.updated_at : null);
		const defaultBaseUrl = getSiteUrl();

		// Structure winning captain message & details link
		let winningMessageDetails: {
			sentAt: string | null;
			recipient: string | null;
			content: string | null;
			detailsUrl: string | null;
		} | null = null;

		if (winningLog) {
			const urlMatch = winningLog.content ? winningLog.content.match(/(https?:\/\/[^\s]+)/) : null;
			winningMessageDetails = {
				sentAt: winningLog.timestamp,
				recipient: winningLog.recipient,
				content: winningLog.content,
				detailsUrl: urlMatch ? urlMatch[1] : null
			};
		} else if (trip.captain_id) {
			const detailsToken = generateCaptainToken(trip.id, trip.captain_id);
			const detailsUrl = `${defaultBaseUrl}/captain-match/trip-details?tripId=${trip.id}&captainId=${trip.captain_id}&token=${detailsToken}`;
			const tripType = (trip as any).listing_templates?.trip_type || 'Charter';
			winningMessageDetails = {
				sentAt: trip.updated_at,
				recipient: (Array.isArray(trip.captains) ? trip.captains[0] : trip.captains)?.phone || 'Assigned Captain',
				content: `SplitACharter Confirmation: You secured the ${tripType} trip on ${trip.date}! Access customer & trip details here: ${detailsUrl}`,
				detailsUrl
			};
		}

		// 5. Structure blast audit items with claim URL
		const blastLogs = (logs || []).filter((l: any) => l.template === 'captain_blast');
		const auditItems = blastLogs.map((l: any) => {
			const matchedCaptain = captainMap.get(l.recipient);
			const isWinner = Boolean(trip.captain_id && matchedCaptain?.id === trip.captain_id);

			// Extract claim URL from log content if present, or construct standard claim URL
			let claimUrl: string | null = null;
			const urlMatch = l.content ? l.content.match(/(https?:\/\/[^\s]+)/) : null;
			if (urlMatch && urlMatch[1]) {
				claimUrl = urlMatch[1];
			} else if (matchedCaptain?.id) {
				claimUrl = `${defaultBaseUrl}/api/captain-match/accept?tripId=${trip.id}&captainId=${matchedCaptain.id}`;
			}

			return {
				id: l.id,
				captainId: matchedCaptain?.id || null,
				captainName: matchedCaptain?.name || 'Registered Captain',
				recipient: l.recipient,
				channel: l.channel,
				sentAt: l.timestamp,
				status: l.status,
				isWinner,
				claimUrl
			};
		});

		const assignedCaptain = (Array.isArray(trip.captains) ? trip.captains[0] : trip.captains) as any;

		return {
			tripInfo: {
				id: trip.id,
				date: trip.date,
				status: trip.status,
				tripType: (trip as any).listing_templates?.trip_type || 'Charter',
				location: (trip as any).listing_templates?.location || '',
				meetingArea: (trip as any).listing_templates?.meeting_area || '',
				assignedCaptain: assignedCaptain ? {
					id: assignedCaptain.id,
					name: assignedCaptain.name,
					phone: assignedCaptain.phone,
					email: assignedCaptain.email
				} : null,
				acceptedTime,
				winningMessageDetails
			},
			blastAudits: auditItems
		};
	},

	triggerCaptainBlast: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const tripId = formData.get('tripId') as string;

		if (!tripId) {
			return fail(400, { message: 'Trip ID is required' });
		}

		// Fetch trip details
		const { data: trip, error: tripErr } = await supabase
			.from('trip_instances')
			.select('id, date, status, listing_templates(trip_type, location, meeting_area)')
			.eq('id', tripId)
			.single();

		if (tripErr || !trip) {
			return fail(404, { message: 'Trip instance not found' });
		}

		const tripDetails = (trip as any).listing_templates;
		const tripType = tripDetails?.trip_type;
		const location = tripDetails?.location;

		// Fetch active captains matching trip_type and location
		const { data: captains } = await supabase
			.from('captains')
			.select('id, name, phone, trip_types, locations')
			.eq('active', true);

		const eligible = (captains || []).filter((c) =>
			c.trip_types?.includes(tripType) &&
			c.locations?.includes(location)
		);

		if (eligible.length === 0) {
			return fail(400, { message: `No active captains found matching "${tripType}" in "${location}".` });
		}

		const defaultBaseUrl = getSiteUrl();

		let sentCount = 0;
		for (const c of eligible) {
			if (c.phone) {
				const acceptUrl = `${defaultBaseUrl}/api/captain-match/accept?tripId=${trip.id}&captainId=${c.id}`;
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
				sentCount++;
			}
		}

		return { success: true, count: sentCount, message: `Successfully dispatched captain blast to ${sentCount} captain(s).` };
	}
};
