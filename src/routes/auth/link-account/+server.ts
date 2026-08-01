import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { executeAccountMerge } from '$lib/account_linking';

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(303, '/login?error=invalid-linking-token');
	}

	const result = await executeAccountMerge(token);

	if (!result.success) {
		const errorMessage = encodeURIComponent(result.error || 'Account linking failed.');
		throw redirect(303, `/login?error=${errorMessage}`);
	}

	if (result.magicLink) {
		throw redirect(303, result.magicLink);
	}

	throw redirect(303, '/dashboard?account_merged=true');
};
