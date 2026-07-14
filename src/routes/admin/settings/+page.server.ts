import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: settings, error: err } = await supabase
		.from('admin_notification_settings')
		.select('*')
		.order('trigger_name', { ascending: true });

	if (err) {
		console.error('Error loading notification settings:', err);
		throw error(500, 'Failed to load settings');
	}

	return {
		settings: settings || []
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
	}
};
