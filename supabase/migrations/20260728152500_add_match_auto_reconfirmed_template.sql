-- Migration: Add match_auto_reconfirmed notification template to admin_notification_settings
INSERT INTO public.admin_notification_settings (trigger_name, email_enabled, sms_enabled, email_template, sms_template)
VALUES (
    'match_auto_reconfirmed',
    true,
    true,
    'Hello {customer_name},

Great news! Your booking for the {trip_type} charter on {trip_date} has matched with another group!

Since you just reserved your slot, your group has been automatically reconfirmed. We are now notifying the existing group to reconfirm their slot. Once both groups are locked in, we will notify captains to accept your trip!

You can view your trip status anytime on your dashboard: {dashboard_url}',
    'SplitACharter: Your booking for {trip_type} on {trip_date} has matched with another group! Your group is automatically reconfirmed. Details: {dashboard_url}'
)
ON CONFLICT (trigger_name)
DO UPDATE SET
    email_template = EXCLUDED.email_template,
    sms_template = EXCLUDED.sms_template,
    updated_at = now();
