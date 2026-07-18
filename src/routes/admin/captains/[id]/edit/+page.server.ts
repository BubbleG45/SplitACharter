import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const [captainRes, tripTypesRes] = await Promise.all([
		supabase
			.from('captains')
			.select('*')
			.eq('id', params.id)
			.maybeSingle(),
		supabase
			.from('trip_types')
			.select('*')
			.order('name', { ascending: true })
	]);

	if (captainRes.error || !captainRes.data) {
		console.error('Error loading captain:', captainRes.error);
		throw error(404, 'Captain not found');
	}

	return {
		captain: captainRes.data,
		tripTypes: tripTypesRes.data || []
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const phone = formData.get('phone') as string;
		const tripTypes = formData.getAll('trip_types') as string[];
		const locations = formData.getAll('locations') as string[];
		const minimumNotice = formData.get('minimum_notice') as string;
		const maxPassengers = parseInt(formData.get('max_passengers') as string, 10);
		const referralPromoCode = formData.get('referral_promo_code') as string;
		const active = formData.get('active') === 'true';
		const notes = formData.get('notes') as string;

		if (!name || !email || !phone) {
			return fail(400, { message: 'Name, Email, and Phone are required.' });
		}

		if (isNaN(maxPassengers) || maxPassengers <= 0) {
			return fail(400, { message: 'Max Passengers must be a positive number.' });
		}

		const { error: updateErr } = await supabase
			.from('captains')
			.update({
				name,
				email,
				phone,
				trip_types: tripTypes,
				locations,
				minimum_notice: minimumNotice || '24 hours',
				max_passengers: maxPassengers,
				referral_promo_code: referralPromoCode || '',
				active,
				admin_notes: notes || null
			})
			.eq('id', params.id);

		if (updateErr) {
			console.error('Error updating captain:', updateErr);
			return fail(500, { message: updateErr.message || 'Failed to update captain record.' });
		}

		throw redirect(303, '/admin/captains');
	}
};
