import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL } from '$env/static/private';

// Sync admin emails from environment variable to database table
const syncAdminEmails = async () => {
	const adminEmailsList = ADMIN_EMAIL
		? ADMIN_EMAIL.split(',').map((email) => email.trim().toLowerCase())
		: [];

	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	try {
		// 1. Sync admin_emails table
		if (adminEmailsList.length > 0) {
			const { data: existingRecords } = await supabaseAdmin
				.from('admin_emails')
				.select('email');

			const existingEmails = (existingRecords || []).map(r => r.email.toLowerCase());
			const toDelete = existingEmails.filter(e => !adminEmailsList.includes(e));
			const toUpsert = adminEmailsList.map(email => ({ email }));

			if (toDelete.length > 0) {
				await supabaseAdmin
					.from('admin_emails')
					.delete()
					.in('email', toDelete);
			}

			if (toUpsert.length > 0) {
				await supabaseAdmin
					.from('admin_emails')
					.upsert(toUpsert);
			}
		} else {
			await supabaseAdmin
				.from('admin_emails')
				.delete()
				.neq('email', '');
		}

		// 2. Backfill existing matching customers into admin_users
		if (adminEmailsList.length > 0) {
			const { data: matchingCustomers } = await supabaseAdmin
				.from('customers')
				.select('id')
				.in('email', adminEmailsList);

			if (matchingCustomers && matchingCustomers.length > 0) {
				const adminInserts = matchingCustomers.map(c => ({ id: c.id }));
				await supabaseAdmin
					.from('admin_users')
					.upsert(adminInserts);
			}
		}
		console.log('Successfully synced admin emails to database');
	} catch (err: any) {
		console.warn('Could not sync admin emails (table might not exist yet):', err.message || err);
	}
};

// Run the sync on server startup
syncAdminEmails();

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize Supabase server client
	event.locals.supabase = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookies) => {
					cookies.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	// Define safeGetSession helper to securely retrieve and validate the user session
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null, isAdmin: false };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) {
			// JWT validation failed or expired
			return { session: null, user: null, isAdmin: false };
		}

		// Check if user is in admin_users
		const { data: adminRecord } = await event.locals.supabase
			.from('admin_users')
			.select('id')
			.eq('id', user.id)
			.maybeSingle();

		const isAdmin = !!adminRecord;

		return { session, user, isAdmin };
	};

	// Resolve the request, filtering serialized response headers for Supabase compatibility
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
