-- Migration: Update captain_confirmed notification template to not include captain phone number and state captain will contact customer.
UPDATE public.admin_notification_settings
SET 
    email_template = 'Great news! Captain {captain_name} has accepted your charter on {trip_date} ({trip_type}).' || chr(10) || chr(10) || 'Meeting Area: {meeting_area}' || chr(10) || chr(10) || 'Your captain has been provided with your contact details and will reach out to you directly to coordinate any final details before departure.',
    sms_template = 'Match confirmed! Captain {captain_name} will be your skipper on {trip_date} at {meeting_area}. They have your contact info and will reach out to you with details.',
    updated_at = now()
WHERE trigger_name = 'captain_confirmed';
