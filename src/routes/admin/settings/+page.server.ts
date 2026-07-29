import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [settingsRes, tripTypesRes, reviewsRes] = await Promise.all([
		supabase
			.from('admin_notification_settings')
			.select('*')
			.order('trigger_name', { ascending: true }),
		supabase
			.from('trip_types')
			.select('*')
			.order('name', { ascending: true }),
		supabase
			.from('landing_reviews')
			.select('*')
			.order('display_order', { ascending: true })
			.order('created_at', { ascending: true })
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
		tripTypes: tripTypesRes.data || [],
		reviews: reviewsRes.data || []
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
	},
	addReview: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const location = (formData.get('location') as string)?.trim();
		const trip = (formData.get('trip') as string)?.trim();
		const stars = parseInt(formData.get('stars') as string || '5', 10);
		const avatar = (formData.get('avatar') as string)?.trim() || name?.substring(0, 2).toUpperCase();
		const quote = (formData.get('quote') as string)?.trim();
		const displayOrder = parseInt(formData.get('display_order') as string || '0', 10);

		if (!name || !location || !trip || !quote) {
			return fail(400, { reviewMessage: 'Name, location, trip type, and quote are required' });
		}

		const { error: insertErr } = await supabase
			.from('landing_reviews')
			.insert({
				name,
				location,
				trip,
				stars,
				avatar,
				quote,
				display_order: displayOrder,
				active: true
			});

		if (insertErr) {
			console.error('Error adding review:', insertErr);
			return fail(500, { reviewMessage: insertErr.message || 'Failed to add review' });
		}

		return { success: true };
	},
	updateReview: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = (formData.get('name') as string)?.trim();
		const location = (formData.get('location') as string)?.trim();
		const trip = (formData.get('trip') as string)?.trim();
		const stars = parseInt(formData.get('stars') as string || '5', 10);
		const avatar = (formData.get('avatar') as string)?.trim();
		const quote = (formData.get('quote') as string)?.trim();
		const displayOrder = parseInt(formData.get('display_order') as string || '0', 10);
		const active = formData.get('active') === 'true';

		if (!id || !name || !location || !trip || !quote) {
			return fail(400, { reviewMessage: 'All fields are required to update a review' });
		}

		const { error: updateErr } = await supabase
			.from('landing_reviews')
			.update({
				name,
				location,
				trip,
				stars,
				avatar,
				quote,
				display_order: displayOrder,
				active
			})
			.eq('id', id);

		if (updateErr) {
			console.error('Error updating review:', updateErr);
			return fail(500, { reviewMessage: updateErr.message || 'Failed to update review' });
		}

		return { success: true };
	},
	toggleReviewActive: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const active = formData.get('active') === 'true';

		if (!id) {
			return fail(400, { reviewMessage: 'Review ID is required' });
		}

		const { error: updateErr } = await supabase
			.from('landing_reviews')
			.update({ active })
			.eq('id', id);

		if (updateErr) {
			console.error('Error toggling review active status:', updateErr);
			return fail(500, { reviewMessage: updateErr.message || 'Failed to toggle status' });
		}

		return { success: true };
	},
	deleteReview: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { reviewMessage: 'Review ID is required' });
		}

		const { error: deleteErr } = await supabase
			.from('landing_reviews')
			.delete()
			.eq('id', id);

		if (deleteErr) {
			console.error('Error deleting review:', deleteErr);
			return fail(500, { reviewMessage: deleteErr.message || 'Failed to delete review' });
		}

		return { success: true };
	}
};
