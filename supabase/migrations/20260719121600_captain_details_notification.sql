-- Migration: Add captain_details_link notification template
INSERT INTO public.admin_notification_settings (trigger_name, email_enabled, sms_enabled, email_template, sms_template)
VALUES
(
    'captain_details_link', 
    false, -- SMS only
    true,
    null,
    'SplitACharter: View passenger details and slip info for your {trip_type} on {trip_date} ({location}): {details_url}'
)
ON CONFLICT (trigger_name) 
DO UPDATE SET 
    sms_template = EXCLUDED.sms_template,
    updated_at = now();
