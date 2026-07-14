import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	create: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const trip_type = formData.get('trip_type') as string;
		const location = formData.get('location') as string;
		const duration = formData.get('duration') as string; // in format "HH:MM"
		const low_price = parseFloat(formData.get('low_price') as string);
		const high_price = parseFloat(formData.get('high_price') as string);
		const max_passengers = parseInt(formData.get('max_passengers') as string, 10);
		const description = formData.get('description') as string;
		const meeting_area = formData.get('meeting_area') as string;
		const active = formData.get('active') === 'true';

		// Parse arrays
		const whats_included_raw = formData.get('whats_included') as string;
		const what_to_bring_raw = formData.get('what_to_bring') as string;

		let whats_included: string[] = [];
		let what_to_bring: string[] = [];

		try {
			whats_included = whats_included_raw ? JSON.parse(whats_included_raw) : [];
			what_to_bring = what_to_bring_raw ? JSON.parse(what_to_bring_raw) : [];
		} catch (err) {
			return fail(400, { message: 'Invalid JSON for arrays.' });
		}

		// Validations
		if (!trip_type || !location || !duration || isNaN(low_price) || isNaN(high_price) || isNaN(max_passengers) || !description || !meeting_area) {
			return fail(400, { message: 'All fields are required and must be valid.' });
		}

		if (low_price > high_price) {
			return fail(400, { message: 'Low price must be less than or equal to high price.' });
		}

		if (max_passengers <= 0) {
			return fail(400, { message: 'Maximum passengers must be greater than 0.' });
		}

		// Convert duration "HH:MM" to Postgres interval "HH hours MM minutes"
		const [hours, minutes] = duration.split(':');
		const intervalStr = `${hours || 0} hours ${minutes || 0} minutes`;

		const { error } = await supabase
			.from('listing_templates')
			.insert({
				trip_type,
				location,
				duration: intervalStr,
				low_price,
				high_price,
				max_passengers,
				description,
				whats_included,
				what_to_bring,
				meeting_area,
				active
			});

		if (error) {
			console.error('Error creating listing template:', error);
			return fail(500, { message: error.message || 'Failed to create listing template.' });
		}

		throw redirect(303, '/admin/listings');
	}
};
