import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createBrowserClient, isBrowser, parse } from '@supabase/ssr';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	depends('supabase:auth');

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch
		},
		cookies: {
			getAll() {
				if (!isBrowser()) {
					return data.cookies;
				}

				const cookieStore = parse(document.cookie);
				return Object.entries(cookieStore).map(([name, value]) => ({
					name,
					value: value ?? ''
				}));
			},
			setAll(cookiesToSet) {
				if (!isBrowser()) {
					return;
				}
				cookiesToSet.forEach(({ name, value, options }) => {
					let cookieStr = `${name}=${value}`;
					if (options) {
						if (options.path) cookieStr += `; path=${options.path}`;
						if (options.maxAge !== undefined) cookieStr += `; max-age=${options.maxAge}`;
						if (options.domain) cookieStr += `; domain=${options.domain}`;
						if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
						if (options.secure) cookieStr += `; secure`;
					}
					document.cookie = cookieStr;
				});
			}
		}
	});

	// Safely retrieve session from the client instance
	const {
		data: { session }
	} = await supabase.auth.getSession();

	return {
		supabase,
		session,
		user: data.user,
		isAdmin: data.isAdmin
	};
};
