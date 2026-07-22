import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL } from '$env/static/private';
import { compileTemplate, sendNotification } from '$lib/notifications';

export const GET: RequestHandler = async () => {
	console.log('--- STARTING NOTIFICATIONS SYSTEM INTEGRATION TESTS ---');

	const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	const testRecipient = {
		email: ADMIN_EMAIL || 'bg@bubbleg.dev',
		phone: '+15551112233',
		name: 'Testy McTester'
	};

	const testData = {
		trip_date: '2029-08-15',
		deadline_time: 'August 14, 2029, 8:00 AM',
		trip_type: 'Test Offshore Fishing'
	};

	const trigger = 'reconfirm_reminder';

	try {
		// Cleanup any leftover test logs from previous runs
		await supabase.from('notification_logs').delete().eq('recipient', testRecipient.email);
		await supabase.from('notification_logs').delete().eq('recipient', testRecipient.phone);

		// 1. Verify template compilation works
		console.log('Testing compiler...');
		const template = 'Hello {customer_name}, reconfirm your {trip_type} before {deadline_time} on {trip_date}.';
		const compiled = compileTemplate(template, {
			customer_name: testRecipient.name,
			trip_type: testData.trip_type,
			deadline_time: testData.deadline_time,
			trip_date: testData.trip_date
		});
		
		const expected = `Hello ${testRecipient.name}, reconfirm your ${testData.trip_type} before ${testData.deadline_time} on ${testData.trip_date}.`;
		if (compiled !== expected) {
			return json({ success: false, error: `Compiler failed! Got: ${compiled}` }, { status: 400 });
		}
		console.log('✔ Template compilation verified.');

		// 2. Load the trigger setting before testing
		const { data: originalSetting } = await supabase
			.from('admin_notification_settings')
			.select('*')
			.eq('trigger_name', trigger)
			.single();

		if (!originalSetting) {
			return json({ success: false, error: 'Trigger setting row not found in DB.' }, { status: 404 });
		}
		console.log(`Loaded trigger: ${trigger}. Email enabled: ${originalSetting.email_enabled}, SMS enabled: ${originalSetting.sms_enabled}`);

		// Force both enabled for first test
		await supabase
			.from('admin_notification_settings')
			.update({ email_enabled: true, sms_enabled: true })
			.eq('trigger_name', trigger);

		// 3. Test sendNotification with BOTH channels enabled
		console.log('Dispatching notification (Both Enabled)...');
		const res1 = await sendNotification(trigger, testRecipient, testData);
		if (!res1.emailSent || !res1.smsSent) {
			return json({ success: false, error: 'Both dispatches should have succeeded.' }, { status: 400 });
		}

		// Check if logs are written to notification_logs table
		const { data: logs1 } = await supabase
			.from('notification_logs')
			.select('*')
			.eq('recipient', testRecipient.email)
			.eq('template', trigger);
		if (!logs1 || logs1.length !== 1 || logs1[0].status !== 'delivered') {
			return json({ success: false, error: `Expected exactly 1 email log with 'delivered' status, found ${logs1?.length || 0}` }, { status: 400 });
		}

		const { data: logs2 } = await supabase
			.from('notification_logs')
			.select('*')
			.eq('recipient', testRecipient.phone)
			.eq('template', trigger);
		if (!logs2 || logs2.length !== 1 || logs2[0].status !== 'delivered') {
			return json({ success: false, error: `Expected exactly 1 SMS log with 'delivered' status, found ${logs2?.length || 0}` }, { status: 400 });
		}
		console.log('✔ Both channels compiled, sent, and logged as "delivered".');

		// 4. Disable Email channel and test suppression logging
		console.log('Disabling Email Channel in Settings...');
		await supabase
			.from('admin_notification_settings')
			.update({ email_enabled: false })
			.eq('trigger_name', trigger);

		console.log('Dispatching notification (Email Disabled, SMS Enabled)...');
		const res2 = await sendNotification(trigger, testRecipient, testData);
		if (res2.emailSent || !res2.smsSent) {
			return json({ success: false, error: 'Email should be skipped and SMS should succeed.' }, { status: 400 });
		}

		// Check logs again
		const { data: logs3 } = await supabase
			.from('notification_logs')
			.select('*')
			.eq('recipient', testRecipient.email)
			.eq('template', trigger)
			.order('timestamp', { ascending: false });
		if (!logs3 || logs3.length !== 2 || logs3[0].status !== 'suppressed') {
			return json({ success: false, error: `Expected 2 email logs, latest status should be 'suppressed'. Found: ${logs3 ? logs3.map(l => l.status).join(',') : 'null'}` }, { status: 400 });
		}
		console.log('✔ Suppression check verified! Logged as "suppressed" correctly.');

		// Restore original settings
		await supabase
			.from('admin_notification_settings')
			.update({
				email_enabled: originalSetting.email_enabled,
				sms_enabled: originalSetting.sms_enabled
			})
			.eq('trigger_name', trigger);

		// Cleanup test logs
		await supabase.from('notification_logs').delete().eq('recipient', testRecipient.email);
		await supabase.from('notification_logs').delete().eq('recipient', testRecipient.phone);

		console.log('--- ALL NOTIFICATION INTEGRATION TESTS PASSED ---');
		return json({ success: true, message: 'All notification integration tests passed successfully!' });
	} catch (err: any) {
		console.error('Test execution failed:', err);
		return json({ success: false, error: err.message || 'Unknown test failure' }, { status: 500 });
	}
};
