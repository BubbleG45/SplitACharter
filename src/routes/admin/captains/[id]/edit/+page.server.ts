import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { formatPromoCode, deriveCaptainPromoCode } from '$lib/promo_codes';
import { releasePendingNeedsCaptainTrips } from '$lib/server/trips';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const [captainRes, tripTypesRes, durationsRes, marinasRes, areasRes] = await Promise.all([
		supabase
			.from('captains')
			.select('*')
			.eq('id', params.id)
			.maybeSingle(),
		supabase
			.from('trip_types')
			.select('*')
			.order('name', { ascending: true }),
		supabase
			.from('durations')
			.select('*')
			.order('hours', { ascending: true }),
		supabase
			.from('marinas')
			.select('id, name, address, active')
			.eq('active', true)
			.order('name', { ascending: true }),
		supabase
			.from('areas')
			.select('*')
			.eq('active', true)
			.order('display_order', { ascending: true })
	]);

	if (captainRes.error || !captainRes.data) {
		console.error('Error loading captain:', captainRes.error);
		throw error(404, 'Captain not found');
	}

	return {
		captain: captainRes.data,
		tripTypes: tripTypesRes.data || [],
		durations: durationsRes.data || [],
		marinas: marinasRes.data || [],
		areas: areasRes.data || []
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const charterName = (formData.get('charter_name') as string)?.trim();
		const email = (formData.get('email') as string)?.trim();
		const phone = (formData.get('phone') as string)?.trim();
		const homeMarinaId = (formData.get('home_marina_id') as string)?.trim() || null;
		const tripTypes = formData.getAll('trip_types') as string[];
		const durations = formData.getAll('durations') as string[];
		const locations = formData.getAll('locations') as string[];
		const minimumNotice = formData.get('minimum_notice') as string;
		const maxPassengers = parseInt(formData.get('max_passengers') as string, 10);
		const rawPromoCode = (formData.get('referral_promo_code') as string)?.trim();
		const active = formData.get('active') === 'true';
		const notes = (formData.get('notes') as string)?.trim();

		if (!name || !email || !phone) {
			return fail(400, { message: 'Captain Name, Email, and Phone are required.' });
		}

		if (isNaN(maxPassengers) || maxPassengers <= 0) {
			return fail(400, { message: 'Max Passengers must be a positive number.' });
		}

		// Auto-derive promo code if left blank
		let referralPromoCode = formatPromoCode(rawPromoCode);
		if (!referralPromoCode) {
			referralPromoCode = deriveCaptainPromoCode(charterName, name);
		}

		if (!referralPromoCode) {
			return fail(400, { message: 'A valid Referral Promo Code is required.' });
		}

		// Ensure promo code is unique across all OTHER captains
		const { data: existingCode } = await supabase
			.from('captains')
			.select('id, name')
			.ilike('referral_promo_code', referralPromoCode)
			.neq('id', params.id)
			.maybeSingle();

		if (existingCode) {
			return fail(400, {
				message: `The referral promo code "${referralPromoCode}" is already assigned to Captain ${existingCode.name}. Please choose a unique code.`
			});
		}

		const updatePayload: Record<string, any> = {
			name,
			charter_name: charterName || null,
			email,
			phone,
			home_marina_id: homeMarinaId,
			trip_types: tripTypes,
			durations: durations,
			locations,
			minimum_notice: minimumNotice || '24 hours',
			max_passengers: maxPassengers,
			referral_promo_code: referralPromoCode,
			active,
			admin_notes: notes || null
		};

		const { error: updateErr } = await supabase
			.from('captains')
			.update(updatePayload)
			.eq('id', params.id);

		if (updateErr) {
			console.error('Error updating captain:', updateErr);
			return fail(500, { message: updateErr.message || 'Failed to update captain record.' });
		}

		// Release any upcoming needs_captain trips if newly covered
		try {
			await releasePendingNeedsCaptainTrips();
		} catch (relErr) {
			console.error('Error releasing pending trips on captain update:', relErr);
		}

		throw redirect(303, '/admin/captains');
	}
};
