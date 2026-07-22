import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [tripsRes, listingsRes] = await Promise.all([
		supabase
			.from('trip_instances')
			.select(`
				id,
				date,
				status,
				captain_id,
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
			.order('date', { ascending: false }),
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
		const email = formData.get('email') as string;
		const phone = formData.get('phone') as string;

		if (!email && !phone) {
			return fail(400, { message: 'Missing recipient identifier' });
		}

		let filterStr = '';
		if (email && phone) {
			filterStr = `recipient.eq.${email},recipient.eq.${phone}`;
		} else if (email) {
			filterStr = `recipient.eq.${email}`;
		} else if (phone) {
			filterStr = `recipient.eq.${phone}`;
		}

		const { data: logs, error: logsErr } = await supabase
			.from('notification_logs')
			.select('*')
			.or(filterStr)
			.order('timestamp', { ascending: false });

		if (logsErr) {
			console.error('Error fetching logs:', logsErr);
			return fail(500, { message: 'Failed to fetch logs' });
		}

		// Filter out login/auth communications and only return trip-related communications
		const tripLogs = (logs || []).filter((l: any) => {
			const template = (l.template || '').toLowerCase();
			const isLoginOrAuth =
				template.includes('auth') ||
				template.includes('login') ||
				template.includes('magic') ||
				template.includes('otp');
			return !isLoginOrAuth;
		});

		return { logs: tripLogs };
	}
};
