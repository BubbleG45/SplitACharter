import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const templates = [
  {
    trigger_name: 'match_detected', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Good news! Your shared charter on {trip_date} ({trip_type}) has been filled with another group.\n\nPlease reconfirm your attendance within your confirmation window to secure your spot.',
    sms_template: 'Good news! Your shared charter on {trip_date} has been filled. Please go to your dashboard to reconfirm your attendance within the reconfirmation window.'
  },
  {
    trigger_name: 'reconfirm_reminder', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'This is a reminder to reconfirm your charter on {trip_date} ({trip_type}). You have until {deadline_time} to verify your slot.',
    sms_template: 'Reminder: Please reconfirm your charter on {trip_date} before the deadline {deadline_time} to secure your slot.'
  },
  {
    trigger_name: 'reconfirm_forfeited', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Your charter reservation on {trip_date} has been forfeited because you failed to reconfirm before the deadline.\n\nAs per our terms, your $50 reservation fee has been forfeited and a strike has been recorded on your profile.',
    sms_template: 'Your reservation for {trip_date} was forfeited because the reconfirmation window expired. Your deposit has been forfeited.'
  },
  {
    trigger_name: 'counterpart_forfeited', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'The other group failed to reconfirm their reservation in time. As a result, the trip has been reset to half-booked.\n\nYour reservation remains active and your deposit is held for the next matched group. You will be notified as soon as a new group joins.',
    sms_template: 'The other group failed to reconfirm in time. Your reservation remains active and your deposit is held for the next matched group.'
  },
  {
    trigger_name: 'captain_blast', 
    email_enabled: false, 
    sms_enabled: true,
    email_template: null,
    sms_template: 'SplitACharter Alert: A confirmed charter of type "{trip_type}" is available on {trip_date} at {location}. Accept here: {accept_url}'
  },
  {
    trigger_name: 'captain_confirmed', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Great news! Captain {captain_name} has accepted your charter on {trip_date} ({trip_type}).\n\nCaptain Contact: {captain_phone}\nMeeting Area: {meeting_area}\n\nPlease reach out to your captain to coordinate any final details.',
    sms_template: 'Match confirmed! Captain {captain_name} will be your skipper. Contact: {captain_phone}. Location: {meeting_area} on {trip_date}.'
  },
  {
    trigger_name: 'captain_secured', 
    email_enabled: false, 
    sms_enabled: true,
    email_template: null,
    sms_template: 'Congratulations Captain {captain_name}! You have secured the charter for {trip_date} ({trip_type}). Passenger list: {passenger_list}.'
  },
  {
    trigger_name: 'matching_timeout', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'We apologize, but we were unable to match a captain for your charter on {trip_date} ({trip_type}).\n\nThe trip has been canceled and your $50 reservation fee has been fully refunded.',
    sms_template: 'We were unable to secure a captain for your charter on {trip_date} ({trip_type}). The trip is canceled, and your deposit has been fully refunded.'
  },
  {
    trigger_name: 'unmatched_trip_timeout',
    email_enabled: true,
    sms_enabled: true,
    email_template: 'We apologize, but your charter on {trip_date} ({trip_type}) did not find a match before the trip date.\n\nThe trip has been canceled and your $50 reservation fee has been fully refunded.',
    sms_template: 'Your charter on {trip_date} ({trip_type}) did not match in time. The trip is canceled and your deposit has been fully refunded.'
  }
];

async function seed() {
  console.log("Upserting templates to admin_notification_settings...");
  const { data, error } = await supabase
    .from('admin_notification_settings')
    .upsert(templates, { onConflict: 'trigger_name' });

  if (error) {
    console.error("Error upserting templates:", error);
    process.exit(1);
  }

  console.log("Templates successfully upserted to Supabase!");
}

seed();
