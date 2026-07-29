import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: listings, error } = await supabase
		.from('listing_templates')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error loading listing templates:', error);
	}

	return {
		listings: listings || []
	};
};

export const actions: Actions = {
	toggleActive: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const active = formData.get('active') === 'true';

		if (!id) {
			return fail(400, { message: 'Missing listing template ID' });
		}

		const { error } = await supabase
			.from('listing_templates')
			.update({ active: !active })
			.eq('id', id);

		if (error) {
			console.error('Error toggling active status:', error);
			return fail(500, { message: 'Failed to toggle status' });
		}

		return { success: true };
	},
	deleteTemplate: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const confirmText = (formData.get('confirmText') as string)?.trim();

		if (!id) {
			return fail(400, { message: 'Missing listing template ID' });
		}

		if (confirmText !== 'DELETE') {
			return fail(400, { message: 'Confirmation text must equal DELETE' });
		}

		// 1. Fetch trip instances referencing this template
		const { data: tripInstances, error: fetchErr } = await supabase
			.from('trip_instances')
			.select('id')
			.eq('listing_template_id', id);

		if (fetchErr) {
			console.error('Error fetching trip instances for template:', fetchErr);
			return fail(500, { message: 'Failed to query referenced trip instances.' });
		}

		if (tripInstances && tripInstances.length > 0) {
			const tripIds = tripInstances.map((t) => t.id);

			// 2. Delete bookings associated with these trip instances
			const { error: bookingsErr } = await supabase
				.from('bookings')
				.delete()
				.in('trip_instance_id', tripIds);

			if (bookingsErr) {
				console.error('Error deleting bookings for template:', bookingsErr);
				return fail(500, { message: 'Failed to clear associated bookings for template.' });
			}

			// 3. Delete trip instances associated with this template
			const { error: tripsErr } = await supabase
				.from('trip_instances')
				.delete()
				.eq('listing_template_id', id);

			if (tripsErr) {
				console.error('Error deleting trip instances for template:', tripsErr);
				return fail(500, { message: 'Failed to clear associated trip instances for template.' });
			}
		}

		// 4. Delete the listing template
		const { error: deleteErr } = await supabase
			.from('listing_templates')
			.delete()
			.eq('id', id);

		if (deleteErr) {
			console.error('Error deleting listing template:', deleteErr);
			return fail(500, { message: deleteErr.message || 'Failed to delete template' });
		}

		return { success: true };
	}
};
