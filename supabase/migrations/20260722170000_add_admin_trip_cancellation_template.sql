-- Migration: Add admin_trip_cancellation template to admin_notification_settings
INSERT INTO public.admin_notification_settings (trigger_name, email_enabled, sms_enabled, email_template, sms_template)
VALUES (
    'admin_trip_cancellation',
    true,
    true,
    'Hello {customer_name},

Your charter reservation on {trip_date} ({trip_type}) has been canceled by SplitACharter operations.

Reason for Cancellation:
{cancellation_reason}

Refund Status:
{refund_status_text}

You can view your account and book another date anytime on your dashboard: {dashboard_url}',
    'SplitACharter Alert: Your charter on {trip_date} ({trip_type}) was canceled. Reason: {cancellation_reason}. {refund_status_text}'
)
ON CONFLICT (trigger_name)
DO UPDATE SET
    email_template = EXCLUDED.email_template,
    sms_template = EXCLUDED.sms_template,
    updated_at = now();
