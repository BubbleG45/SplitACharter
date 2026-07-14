import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { sendNotification } from '$lib/notifications';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [listingsRes, tripsRes, bookingsRes, captainsRes] = await Promise.all([
		supabase.from('listing_templates').select('id', { count: 'exact', head: true }),
		supabase.from('trip_instances').select('id', { count: 'exact', head: true }),
		supabase.from('bookings').select('id', { count: 'exact', head: true }),
		supabase.from('captains').select('id', { count: 'exact', head: true })
	]);

	// Fetch recent bookings (limit 5)
	const { data: recentBookings } = await supabase
		.from('bookings')
		.select('id, group_size, status, created_at, customers(name), trip_instances(date, listing_templates(trip_type))')
		.order('created_at', { ascending: false })
		.limit(5);

	// Fetch upcoming active trips for weather review (confirmed, pending-reconfirm, or half-booked in next 7 days)
	const today = new Date().toISOString().split('T')[0];
	const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
	const { data: upcomingTrips } = await supabase
		.from('trip_instances')
		.select('id, date, status, listing_templates(trip_type, location)')
		.gte('date', today)
		.lte('date', nextWeek)
		.in('status', ['half-booked', 'pending-reconfirm', 'confirmed'])
		.order('date', { ascending: true });

	return {
		stats: {
			listingsCount: listingsRes.count || 0,
			tripsCount: tripsRes.count || 0,
			bookingsCount: bookingsRes.count || 0,
			captainsCount: captainsRes.count || 0
		},
		recentBookings: recentBookings || [],
		upcomingTrips: upcomingTrips || []
	};
};

export const actions: Actions = {
	weatherCancel: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const tripId = formData.get('tripId') as string;

		if (!tripId) {
			return fail(400, { message: 'Missing trip ID' });
		}

		// Cancel trip instance
		const { error: cancelErr } = await supabase
			.from('trip_instances')
			.update({ status: 'canceled' })
			.eq('id', tripId);

		if (cancelErr) {
			console.error('Error canceling trip for weather:', cancelErr);
			return fail(500, { message: 'Failed to cancel trip instance.' });
		}

		// Cancel bookings and trigger refunds
		const { data: bookings } = await supabase
			.from('bookings')
			.select('id, customers(name, phone, email), trip_instances(date, listing_templates(trip_type))')
			.eq('trip_instance_id', tripId)
			.not('status', 'in', '("canceled","forfeited")');

		if (bookings && bookings.length > 0) {
			for (const b of bookings) {
				await supabase.from('bookings').update({ status: 'canceled' }).eq('id', b.id);

				const refundId = `re_weather_${Math.random().toString(36).substring(2, 12)}`;
				await supabase.from('payment_records').insert({
					booking_id: b.id,
					stripe_payment_intent_id: refundId,
					amount: -50.00,
					status: 'refunded'
				});

				const customer = (b as any).customers;
				const trip = (b as any).trip_instances;
				const tripDetails = trip?.listing_templates;

				if (customer) {
					await sendNotification(
						'matching_timeout', // Reuses the refund notification template
						{ email: customer.email, phone: customer.phone, name: customer.name },
						{
							trip_date: trip?.date || '',
							trip_type: tripDetails?.trip_type || ''
						}
					);
				}
			}
		}

		return { success: true };
	}
};
