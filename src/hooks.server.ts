import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL } from '$env/static/private';

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

		// Bootstrap admin dynamically if the email matches one of the comma-separated ADMIN_EMAIL list
		const adminEmails = ADMIN_EMAIL
			? ADMIN_EMAIL.split(',').map((email) => email.trim().toLowerCase())
			: [];

		if (user.email && adminEmails.includes(user.email.toLowerCase())) {
			const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
			
			// Check if already in admin_users table
			const { data: adminExists } = await supabaseAdmin
				.from('admin_users')
				.select('id')
				.eq('id', user.id)
				.maybeSingle();

			if (!adminExists) {
				await supabaseAdmin
					.from('admin_users')
					.insert({ id: user.id });
			}
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
