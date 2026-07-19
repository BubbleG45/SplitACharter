import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: customers, error: loadErr } = await supabase
		.from('customers')
		.select(`
			*,
			customer_strikes (
				id,
				reason,
				created_at,
				trip_instance_id,
				trip_instances (
					id,
					date,
					listing_templates (
						trip_type,
						location
					)
				)
			),
			bookings (
				id,
				trip_instances (
					id,
					date,
					listing_templates (
						trip_type,
						location
					)
				)
			)
		`)
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

	addStrike: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const customerId = formData.get('customerId') as string;
		const reason = formData.get('reason') as string;
		const tripInstanceId = formData.get('tripInstanceId') as string;

		if (!customerId || !reason) {
			return fail(400, { message: 'Missing customer ID or reason' });
		}

		const { error: insertErr } = await supabase
			.from('customer_strikes')
			.insert({
				customer_id: customerId,
				trip_instance_id: tripInstanceId || null,
				reason
			});

		if (insertErr) {
			console.error('Error adding customer strike:', insertErr);
			return fail(500, { message: 'Failed to add strike.' });
		}

		return { success: true };
	},

	deleteStrike: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const strikeId = formData.get('strikeId') as string;

		if (!strikeId) {
			return fail(400, { message: 'Missing strike ID' });
		}

		const { error: deleteErr } = await supabase
			.from('customer_strikes')
			.delete()
			.eq('id', strikeId);

		if (deleteErr) {
			console.error('Error deleting strike:', deleteErr);
			return fail(500, { message: 'Failed to delete strike.' });
		}

		return { success: true };
	},

	clearStrikes: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const customerId = formData.get('customerId') as string;

		if (!customerId) {
			return fail(400, { message: 'Missing customer ID' });
		}

		const { error: deleteErr } = await supabase
			.from('customer_strikes')
			.delete()
			.eq('customer_id', customerId);

		if (deleteErr) {
			console.error('Error clearing customer strikes:', deleteErr);
			return fail(500, { message: 'Failed to clear strikes.' });
		}

		return { success: true };
	}
};
