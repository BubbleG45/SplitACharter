-- Migration: Add email and SMS template storage to admin_notification_settings and seed default values
ALTER TABLE public.admin_notification_settings 
ADD COLUMN IF NOT EXISTS email_template text,
ADD COLUMN IF NOT EXISTS sms_template text;

-- Insert or update default templates for the 7 triggers
INSERT INTO public.admin_notification_settings (trigger_name, email_enabled, sms_enabled, email_template, sms_template)
VALUES
(
    'match_detected', 
    true, 
    true,
    'Hello {customer_name},\n\nA match has been found for your charter on {trip_date} ({trip_type}). Please reconfirm your attendance here: {dashboard_url}',
    'A match has been found for your charter on {trip_date}! Please go to your dashboard to reconfirm your attendance within the reconfirmation window.'
),
(
    'reconfirm_reminder', 
    true, 
    true,
    'Hello {customer_name},\n\nThis is a reminder to reconfirm your charter on {trip_date}. You have until {deadline_time} to verify your slot. Confirm here: {dashboard_url}',
    'Reminder: Please reconfirm your charter on {trip_date} before the deadline {deadline_time} to secure your slot.'
),
(
    'reconfirm_forfeited', 
    true, 
    true,
    'Hello {customer_name},\n\nYour charter reservation on {trip_date} has been forfeited because you failed to reconfirm before the deadline. Your deposit has been forfeited and a strike has been recorded.',
    'Your reservation for {trip_date} was forfeited because the reconfirmation window expired. Your deposit has been forfeited.'
),
(
    'captain_blast', 
    false, -- No email for captain blast, SMS only
    true,
    null,
    'SplitACharter Alert: A confirmed charter of type "{trip_type}" is available on {trip_date} at {location}. Accept here: {accept_url}'
),
(
    'captain_confirmed', 
    true, 
    true,
    'Hello {customer_name},\n\nGreat news! Captain {captain_name} has accepted your charter on {trip_date} ({trip_type}). You can reach them at {captain_phone}. Meeting location is {meeting_area}.',
    'Match confirmed! Captain {captain_name} will be your skipper. Contact: {captain_phone}. Location: {meeting_area} on {trip_date}.'
),
(
    'captain_secured', 
    false, -- Captain accepts via link, receives SMS confirmation
    true,
    null,
    'Congratulations Captain {captain_name}! You have secured the charter for {trip_date} ({trip_type}). Passenger list: {passenger_list}.'
),
(
    'matching_timeout', 
    true, 
    true,
    'Hello {customer_name},\n\nWe apologize, but we were unable to match a captain for your charter on {trip_date}. The trip has been canceled and your deposit has been fully refunded.',
    'We were unable to secure a captain for your charter on {trip_date} ({trip_type}). The trip is canceled, and your deposit has been fully refunded.'
)
ON CONFLICT (trigger_name) 
DO UPDATE SET 
    email_template = EXCLUDED.email_template,
    sms_template = EXCLUDED.sms_template,
    updated_at = now();
