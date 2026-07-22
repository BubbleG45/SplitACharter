-- Migration: Add reservation_pending_match notification template to admin_notification_settings
INSERT INTO public.admin_notification_settings (trigger_name, email_enabled, sms_enabled, email_template, sms_template)
VALUES (
    'reservation_pending_match',
    true,
    true,
    'Hello {customer_name},

Thank you for your reservation! Your payment has been received for the {trip_type} charter on {trip_date}.

Your group is confirmed and we are actively matching your charter with a second group. Once another group joins, you will receive a notification to reconfirm your trip slot.

You can view and manage your reservation anytime on your dashboard: {dashboard_url}',
    'SplitACharter: Your reservation for {trip_type} on {trip_date} is confirmed! We are waiting for a 2nd group to join. Details: {dashboard_url}'
)
ON CONFLICT (trigger_name)
DO UPDATE SET
    email_template = EXCLUDED.email_template,
    sms_template = EXCLUDED.sms_template,
    updated_at = now();
