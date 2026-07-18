import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [settingsRes, tripTypesRes] = await Promise.all([
		supabase
			.from('admin_notification_settings')
			.select('*')
			.order('trigger_name', { ascending: true }),
		supabase
			.from('trip_types')
			.select('*')
			.order('name', { ascending: true })
	]);

	if (settingsRes.error) {
		console.error('Error loading notification settings:', settingsRes.error);
		throw error(500, 'Failed to load settings');
	}

	if (tripTypesRes.error) {
		console.error('Error loading trip types:', tripTypesRes.error);
		throw error(500, 'Failed to load trip types');
	}

	return {
		settings: settingsRes.data || [],
		tripTypes: tripTypesRes.data || []
	};
};

export const actions: Actions = {
	saveTemplate: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const emailEnabled = formData.get('email_enabled') === 'true';
		const smsEnabled = formData.get('sms_enabled') === 'true';
		const emailTemplate = formData.get('email_template') as string;
		const smsTemplate = formData.get('sms_template') as string;

		if (!id) {
			return fail(400, { message: 'Missing setting ID' });
		}

		const { error: updateErr } = await supabase
			.from('admin_notification_settings')
			.update({
				email_enabled: emailEnabled,
				sms_enabled: smsEnabled,
				email_template: emailTemplate || null,
				sms_template: smsTemplate || null
			})
			.eq('id', id);

		if (updateErr) {
			console.error('Error updating notification setting:', updateErr);
			return fail(500, { message: updateErr.message || 'Failed to update template' });
		}

		return { success: true };
	},
	addTripType: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();

		if (!name) {
			return fail(400, { tripTypeMessage: 'Trip type name is required' });
		}

		const { error: insertErr } = await supabase
			.from('trip_types')
			.insert({ name });

		if (insertErr) {
			console.error('Error adding trip type:', insertErr);
			if (insertErr.code === '23505') {
				return fail(400, { tripTypeMessage: 'This trip type already exists' });
			}
			return fail(500, { tripTypeMessage: insertErr.message || 'Failed to add trip type' });
		}

		return { success: true };
	},
	deleteTripType: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;

		if (!name) {
			return fail(400, { tripTypeMessage: 'Trip type name is required' });
		}

		const { error: deleteErr } = await supabase
			.from('trip_types')
			.delete()
			.eq('name', name);

		if (deleteErr) {
			console.error('Error deleting trip type:', deleteErr);
			if (deleteErr.code === '23503') {
				return fail(400, { tripTypeMessage: 'This trip type is currently in use by a listing template and cannot be deleted.' });
			}
			return fail(500, { tripTypeMessage: deleteErr.message || 'Failed to delete trip type' });
		}

		return { success: true };
	}
};

