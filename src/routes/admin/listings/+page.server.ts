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

		if (!id) {
			return fail(400, { message: 'Missing listing template ID' });
		}

		const { error } = await supabase
			.from('listing_templates')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Error deleting listing template:', error);
			if (error.code === '23503') {
				return fail(400, { message: 'Cannot delete template because it is referenced by existing trip instances or bookings.' });
			}
			return fail(500, { message: error.message || 'Failed to delete template' });
		}

		return { success: true };
	}
};
