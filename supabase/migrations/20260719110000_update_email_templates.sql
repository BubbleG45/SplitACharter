-- Migration: Update email and SMS templates for SplitACharter triggers

-- Insert or update default templates for all 8 triggers (including the 2 new ones)
INSERT INTO public.admin_notification_settings (trigger_name, email_enabled, sms_enabled, email_template, sms_template)
VALUES
(
    'match_detected', 
    true, 
    true,
    'Good news! Your shared charter on {trip_date} ({trip_type}) has been filled with another group.\n\nPlease reconfirm your attendance within your confirmation window to secure your spot.',
    'Good news! Your shared charter on {trip_date} has been filled. Please go to your dashboard to reconfirm your attendance within the reconfirmation window.'
),
(
    'reconfirm_reminder', 
    true, 
    true,
    'This is a reminder to reconfirm your charter on {trip_date} ({trip_type}). You have until {deadline_time} to verify your slot.',
    'Reminder: Please reconfirm your charter on {trip_date} before the deadline {deadline_time} to secure your slot.'
),
(
    'reconfirm_forfeited', 
    true, 
    true,
    'Your charter reservation on {trip_date} has been forfeited because you failed to reconfirm before the deadline.\n\nAs per our terms, your $50 reservation fee has been forfeited and a strike has been recorded on your profile.',
    'Your reservation for {trip_date} was forfeited because the reconfirmation window expired. Your deposit has been forfeited.'
),
(
    'counterpart_forfeited', 
    true, 
    true,
    'The other group failed to reconfirm their reservation in time. As a result, the trip has been reset to half-booked.\n\nYour reservation remains active and your deposit is held for the next matched group. You will be notified as soon as a new group joins.',
    'The other group failed to reconfirm in time. Your reservation remains active and your deposit is held for the next matched group.'
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
    'Great news! Captain {captain_name} has accepted your charter on {trip_date} ({trip_type}).\n\nCaptain Contact: {captain_phone}\nMeeting Area: {meeting_area}\n\nPlease reach out to your captain to coordinate any final details.',
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
    'We apologize, but we were unable to match a captain for your charter on {trip_date} ({trip_type}).\n\nThe trip has been canceled and your $50 reservation fee has been fully refunded.',
    'We were unable to secure a captain for your charter on {trip_date} ({trip_type}). The trip is canceled, and your deposit has been fully refunded.'
),
(
    'unmatched_trip_timeout',
    true,
    true,
    'We apologize, but your charter on {trip_date} ({trip_type}) did not find a match before the trip date.\n\nThe trip has been canceled and your $50 reservation fee has been fully refunded.',
    'Your charter on {trip_date} ({trip_type}) did not match in time. The trip is canceled and your deposit has been fully refunded.'
)
ON CONFLICT (trigger_name) 
DO UPDATE SET 
    email_template = EXCLUDED.email_template,
    sms_template = EXCLUDED.sms_template,
    updated_at = now();
