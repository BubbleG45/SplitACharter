import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

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

		// 1. Primary Check: is user's ID in admin_users?
		const { data: adminRecord } = await event.locals.supabase
			.from('admin_users')
			.select('id')
			.eq('id', user.id)
			.maybeSingle();

		let isAdmin = !!adminRecord;

		// 2. Secondary Check: if not in admin_users, check if email is in admin_emails table in DB
		if (!isAdmin && user.email) {
			const { data: adminEmailMatch } = await event.locals.supabase
				.from('admin_emails')
				.select('email')
				.ilike('email', user.email)
				.maybeSingle();

			if (adminEmailMatch) {
				isAdmin = true;
				// Auto-sync into admin_users using service role key
				const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
				await supabaseAdmin
					.from('admin_users')
					.upsert({ id: user.id });
			}
		}

		return { session, user, isAdmin };
	};

	// Resolve the request, filtering serialized response headers for Supabase compatibility
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

