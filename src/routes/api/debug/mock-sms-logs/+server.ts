import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
	const { data: logs, error } = await supabase
		.from('notification_logs')
		.select('id, recipient, content, timestamp')
		.eq('channel', 'sms')
		.order('timestamp', { ascending: false })
		.limit(10);

	if (error) {
		console.error('Error fetching mock SMS logs:', error);
		return json({ error: error.message }, { status: 500 });
	}

	return json({ logs: logs || [] });
};
