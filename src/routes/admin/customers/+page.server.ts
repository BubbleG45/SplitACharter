import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: customers, error: loadErr } = await supabase
		.from('customers')
		.select('*')
		.order('name', { ascending: true });

	if (loadErr) {
		console.error('Error loading customers for admin:', loadErr);
		throw error(500, 'Failed to load customers list');
	}

	return {
		customers: customers || []
	};
};

export const actions: Actions = {
	toggleFlag: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const customerId = formData.get('customerId') as string;
		const currentFlagged = formData.get('currentFlagged') === 'true';

		if (!customerId) {
			return fail(400, { message: 'Missing customer ID' });
		}

		const { error: updateErr } = await supabase
			.from('customers')
			.update({ flagged: !currentFlagged })
			.eq('id', customerId);

		if (updateErr) {
			console.error('Error toggling customer flag:', updateErr);
			return fail(500, { message: 'Failed to update flag status.' });
		}

		return { success: true };
	},

	clearStrikes: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const customerId = formData.get('customerId') as string;

		if (!customerId) {
			return fail(400, { message: 'Missing customer ID' });
		}

		const { error: updateErr } = await supabase
			.from('customers')
			.update({
				strike_count: 0,
				flagged: false
			})
			.eq('id', customerId);

		if (updateErr) {
			console.error('Error clearing customer strikes:', updateErr);
			return fail(500, { message: 'Failed to clear strikes.' });
		}

		return { success: true };
	}
};
