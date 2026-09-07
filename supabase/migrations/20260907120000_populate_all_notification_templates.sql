-- Migration: Ensure all 13 notification settings have complete, non-null email and SMS templates
INSERT INTO public.admin_notification_settings (trigger_name, email_enabled, sms_enabled, email_template, sms_template)
VALUES
(
    'admin_trip_cancellation',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'Your charter reservation on {trip_date} ({trip_type}) has been canceled by SplitACharter operations.' || chr(10) || chr(10) || 'Reason for Cancellation:' || chr(10) || '{cancellation_reason}' || chr(10) || chr(10) || 'Refund Status:' || chr(10) || '{refund_status_text}' || chr(10) || chr(10) || 'You can view your account and book another date anytime on your dashboard: {dashboard_url}',
    'SplitACharter Alert: Your charter on {trip_date} ({trip_type}) was canceled. Reason: {cancellation_reason}. {refund_status_text} View details: {dashboard_url}'
),
(
    'reservation_pending_match',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'Thank you for your reservation! Your payment has been received for the {trip_type} charter on {trip_date}.' || chr(10) || chr(10) || 'Your group is confirmed and we are actively matching your charter with a second group. Once another group joins, you will receive a notification to reconfirm your trip slot.' || chr(10) || chr(10) || 'You can view and manage your reservation anytime on your dashboard: {dashboard_url}',
    'SplitACharter: Your reservation for {trip_type} on {trip_date} is confirmed! We are waiting for a 2nd group to join. Details: {dashboard_url}'
),
(
    'match_detected',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'Good news! A second group has joined your shared charter on {trip_date} ({trip_type}).' || chr(10) || chr(10) || 'Please reconfirm your attendance within your confirmation window to secure your spot:' || chr(10) || chr(10) || '{dashboard_url}',
    'Good news! Your shared charter on {trip_date} ({trip_type}) has been filled. Please reconfirm your attendance on your dashboard: {dashboard_url}'
),
(
    'match_auto_reconfirmed',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'Great news! Your booking for the {trip_type} charter on {trip_date} has matched with another group!' || chr(10) || chr(10) || 'Since you just reserved your slot, your group has been automatically reconfirmed. We are now notifying the existing group to reconfirm their slot. Once both groups are locked in, we will notify captains to accept your trip!' || chr(10) || chr(10) || 'You can view your trip status anytime on your dashboard: {dashboard_url}',
    'SplitACharter: Your booking for {trip_type} on {trip_date} has matched with another group! Your group is automatically reconfirmed. Details: {dashboard_url}'
),
(
    'reconfirm_reminder',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'This is a reminder to reconfirm your charter on {trip_date} ({trip_type}). You have until {deadline_time} to verify your slot.' || chr(10) || chr(10) || 'Reconfirm your slot here: {dashboard_url}',
    'Reminder: Please reconfirm your charter on {trip_date} before the deadline {deadline_time} to secure your slot: {dashboard_url}'
),
(
    'reconfirm_forfeited',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'Your charter reservation on {trip_date} ({trip_type}) has been forfeited because you failed to reconfirm before the deadline.' || chr(10) || chr(10) || 'As per our terms, your $50 reservation fee has been forfeited and a strike has been recorded on your profile.' || chr(10) || chr(10) || 'You can view your account status on your dashboard: {dashboard_url}',
    'Your reservation for {trip_date} was forfeited because the reconfirmation window expired. Your deposit has been forfeited. Details: {dashboard_url}'
),
(
    'counterpart_forfeited',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'The other group on your charter for {trip_date} ({trip_type}) did not reconfirm in time. As a result, the trip has been reset to Half-Booked so a new group can join.' || chr(10) || chr(10) || 'Your reservation status is active and your $50 reservation fee is held for the next matched group. You will be notified as soon as another group joins.' || chr(10) || chr(10) || 'View details on your dashboard: {dashboard_url}',
    'SplitACharter: The other group on your {trip_date} charter did not reconfirm in time. Your trip is reset to Half-Booked and your fee is held for the next match. Details: {dashboard_url}'
),
(
    'captain_blast',
    false,
    true,
    'Hello Captain,' || chr(10) || chr(10) || 'A confirmed shared charter of type "{trip_type}" is available on {trip_date} in {location}.' || chr(10) || chr(10) || 'Both groups are locked in and ready. The first captain to accept will be awarded this booking.' || chr(10) || chr(10) || 'Accept charter here: {accept_url}',
    'SplitACharter Alert: A confirmed charter of type "{trip_type}" is available on {trip_date} at {location}. Accept here: {accept_url}'
),
(
    'captain_confirmed',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'Great news! Captain {captain_name} has accepted your charter on {trip_date} ({trip_type}).' || chr(10) || chr(10) || 'Meeting Area: {meeting_area}' || chr(10) || 'Captain Contact: {captain_phone}' || chr(10) || chr(10) || 'Your captain has been provided with your contact details and will reach out to you directly to coordinate any final details before departure.' || chr(10) || chr(10) || 'View trip details: {dashboard_url}',
    'Match confirmed! Captain {captain_name} will be your skipper on {trip_date} at {meeting_area}. Contact: {captain_phone}. Details: {dashboard_url}'
),
(
    'captain_secured',
    false,
    true,
    'Congratulations Captain {captain_name}!' || chr(10) || chr(10) || 'You have successfully secured the charter for {trip_date} ({trip_type}).' || chr(10) || chr(10) || 'Passenger List:' || chr(10) || '{passenger_list}' || chr(10) || chr(10) || 'Thank you for skippering with SplitACharter!',
    'Congratulations Captain {captain_name}! You have secured the charter for {trip_date} ({trip_type}). Passenger list: {passenger_list}.'
),
(
    'captain_details_link',
    false,
    true,
    'Hello Captain,' || chr(10) || chr(10) || 'Here are the passenger details and manifest for your upcoming {trip_type} charter on {trip_date} in {location}.' || chr(10) || chr(10) || 'You can view passenger names, group sizes, phone numbers, and slip coordination details at the link below:' || chr(10) || chr(10) || '{details_url}',
    'SplitACharter: View passenger details and slip info for your {trip_type} on {trip_date} ({location}): {details_url}'
),
(
    'matching_timeout',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'We apologize, but we were unable to match an available captain for your charter on {trip_date} ({trip_type}).' || chr(10) || chr(10) || 'The trip has been canceled and your $50 reservation fee has been fully refunded to your original payment method.' || chr(10) || chr(10) || 'You can view your refund status or book a new date on your dashboard: {dashboard_url}',
    'We were unable to secure a captain for your charter on {trip_date} ({trip_type}). The trip is canceled, and your deposit has been fully refunded.'
),
(
    'unmatched_trip_timeout',
    true,
    true,
    'Hello {customer_name},' || chr(10) || chr(10) || 'We apologize, but your charter on {trip_date} ({trip_type}) did not find a matching second group before the trip date.' || chr(10) || chr(10) || 'The trip has been canceled and your $50 reservation fee has been fully refunded to your original payment method.' || chr(10) || chr(10) || 'You can view your refund details or explore other charter dates on your dashboard: {dashboard_url}',
    'Your charter on {trip_date} ({trip_type}) did not match in time. The trip is canceled and your deposit has been fully refunded.'
)
ON CONFLICT (trigger_name)
DO UPDATE SET
    email_template = COALESCE(EXCLUDED.email_template, admin_notification_settings.email_template),
    sms_template = EXCLUDED.sms_template,
    updated_at = now();

-- Ensure email_template is also updated for any row where it was previously NULL
UPDATE public.admin_notification_settings
SET email_template = 'Congratulations Captain {captain_name}!' || chr(10) || chr(10) || 'You have successfully secured the charter for {trip_date} ({trip_type}).' || chr(10) || chr(10) || 'Passenger List:' || chr(10) || '{passenger_list}' || chr(10) || chr(10) || 'Thank you for skippering with SplitACharter!'
WHERE trigger_name = 'captain_secured' AND email_template IS NULL;

UPDATE public.admin_notification_settings
SET email_template = 'Hello Captain,' || chr(10) || chr(10) || 'Here are the passenger details and manifest for your upcoming {trip_type} charter on {trip_date} in {location}.' || chr(10) || chr(10) || 'You can view passenger names, group sizes, phone numbers, and slip coordination details at the link below:' || chr(10) || chr(10) || '{details_url}'
WHERE trigger_name = 'captain_details_link' AND email_template IS NULL;
