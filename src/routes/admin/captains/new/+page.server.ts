import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: tripTypes, error: ttErr } = await supabase
		.from('trip_types')
		.select('*')
		.order('name', { ascending: true });

	if (ttErr) {
		console.error('Error loading trip types:', ttErr);
		throw error(500, 'Failed to load allowed trip types');
	}

	return {
		tripTypes: tripTypes || []
	};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const phone = formData.get('phone') as string;
		const tripTypes = formData.getAll('trip_types') as string[];
		const locations = formData.getAll('locations') as string[];
		const minimumNotice = formData.get('minimum_notice') as string;
		const maxPassengers = parseInt(formData.get('max_passengers') as string, 10);
		let referralPromoCode = formData.get('referral_promo_code') as string;
		const active = formData.get('active') === 'true';
		const notes = formData.get('notes') as string;

		if (!name || !email || !phone) {
			return fail(400, { message: 'Name, Email, and Phone are required.' });
		}

		if (isNaN(maxPassengers) || maxPassengers <= 0) {
			return fail(400, { message: 'Max Passengers must be a positive number.' });
		}

		// Auto-generate promo code if not provided
		if (!referralPromoCode) {
			const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
			const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
			referralPromoCode = `REF_${cleanName}_${randomStr}`;
		}

		const { error: insertErr } = await supabase
			.from('captains')
			.insert({
				name,
				email,
				phone,
				trip_types: tripTypes,
				locations,
				minimum_notice: minimumNotice || '24 hours',
				max_passengers: maxPassengers,
				referral_promo_code: referralPromoCode,
				active,
				admin_notes: notes || null
			});

		if (insertErr) {
			console.error('Error creating captain:', insertErr);
			return fail(500, { message: insertErr.message || 'Failed to create captain record.' });
		}

		throw redirect(303, '/admin/captains');
	}
};
