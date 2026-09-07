import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let env = {};
try {
    const envFile = fs.readFileSync('.env', 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] ? match[2].trim() : '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            env[match[1]] = value;
        }
    });
} catch (e) {}

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const templates = [
  {
    trigger_name: 'admin_trip_cancellation',
    email_enabled: true,
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nYour charter reservation on {trip_date} ({trip_type}) has been canceled by SplitACharter operations.\n\nReason for Cancellation:\n{cancellation_reason}\n\nRefund Status:\n{refund_status_text}\n\nYou can view your account and book another date anytime on your dashboard: {dashboard_url}',
    sms_template: 'SplitACharter Alert: Your charter on {trip_date} ({trip_type}) was canceled. Reason: {cancellation_reason}. {refund_status_text} View details: {dashboard_url}'
  },
  {
    trigger_name: 'reservation_pending_match',
    email_enabled: true,
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nThank you for your reservation! Your payment has been received for the {trip_type} charter on {trip_date}.\n\nYour group is confirmed and we are actively matching your charter with a second group. Once another group joins, you will receive a notification to reconfirm your trip slot.\n\nYou can view and manage your reservation anytime on your dashboard: {dashboard_url}',
    sms_template: 'SplitACharter: Your reservation for {trip_type} on {trip_date} is confirmed! We are waiting for a 2nd group to join. Details: {dashboard_url}'
  },
  {
    trigger_name: 'match_detected', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nGood news! A second group has joined your shared charter on {trip_date} ({trip_type}).\n\nPlease reconfirm your attendance within your confirmation window to secure your spot:\n\n{dashboard_url}',
    sms_template: 'Good news! Your shared charter on {trip_date} ({trip_type}) has been filled. Please reconfirm your attendance on your dashboard: {dashboard_url}'
  },
  {
    trigger_name: 'match_auto_reconfirmed', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nGreat news! Your booking for the {trip_type} charter on {trip_date} has matched with another group!\n\nSince you just reserved your slot, your group has been automatically reconfirmed. We are now notifying the existing group to reconfirm their slot. Once both groups are locked in, we will notify captains to accept your trip!\n\nYou can view your trip status anytime on your dashboard: {dashboard_url}',
    sms_template: 'SplitACharter: Your booking for {trip_type} on {trip_date} has matched with another group! Your group is automatically reconfirmed. Details: {dashboard_url}'
  },
  {
    trigger_name: 'reconfirm_reminder', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nThis is a reminder to reconfirm your charter on {trip_date} ({trip_type}). You have until {deadline_time} to verify your slot.\n\nReconfirm your slot here: {dashboard_url}',
    sms_template: 'Reminder: Please reconfirm your charter on {trip_date} before the deadline {deadline_time} to secure your slot: {dashboard_url}'
  },
  {
    trigger_name: 'reconfirm_forfeited', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nYour charter reservation on {trip_date} ({trip_type}) has been forfeited because you failed to reconfirm before the deadline.\n\nAs per our terms, your $50 reservation fee has been forfeited and a strike has been recorded on your profile.\n\nYou can view your account status on your dashboard: {dashboard_url}',
    sms_template: 'Your reservation for {trip_date} was forfeited because the reconfirmation window expired. Your deposit has been forfeited. Details: {dashboard_url}'
  },
  {
    trigger_name: 'counterpart_forfeited', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nThe other group on your charter for {trip_date} ({trip_type}) did not reconfirm in time. As a result, the trip has been reset to Half-Booked so a new group can join.\n\nYour reservation status is active and your $50 reservation fee is held for the next matched group. You will be notified as soon as another group joins.\n\nView details on your dashboard: {dashboard_url}',
    sms_template: 'SplitACharter: The other group on your {trip_date} charter did not reconfirm in time. Your trip is reset to Half-Booked and your fee is held for the next match. Details: {dashboard_url}'
  },
  {
    trigger_name: 'captain_blast', 
    email_enabled: false, 
    sms_enabled: true,
    email_template: 'Hello Captain,\n\nA confirmed shared charter of type "{trip_type}" is available on {trip_date} in {location}.\n\nBoth groups are locked in and ready. The first captain to accept will be awarded this booking.\n\nAccept charter here: {accept_url}',
    sms_template: 'SplitACharter Alert: A confirmed charter of type "{trip_type}" is available on {trip_date} at {location}. Accept here: {accept_url}'
  },
  {
    trigger_name: 'captain_confirmed', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nGreat news! Captain {captain_name} has accepted your charter on {trip_date} ({trip_type}).\n\nMeeting Area: {meeting_area}\nCaptain Contact: {captain_phone}\n\nYour captain has been provided with your contact details and will reach out to you directly to coordinate any final details before departure.\n\nView trip details: {dashboard_url}',
    sms_template: 'Match confirmed! Captain {captain_name} will be your skipper on {trip_date} at {meeting_area}. Contact: {captain_phone}. Details: {dashboard_url}'
  },
  {
    trigger_name: 'captain_secured', 
    email_enabled: false, 
    sms_enabled: true,
    email_template: 'Congratulations Captain {captain_name}!\n\nYou have successfully secured the charter for {trip_date} ({trip_type}).\n\nPassenger List:\n{passenger_list}\n\nThank you for skippering with SplitACharter!',
    sms_template: 'Congratulations Captain {captain_name}! You have secured the charter for {trip_date} ({trip_type}). Passenger list: {passenger_list}.'
  },
  {
    trigger_name: 'captain_details_link',
    email_enabled: false,
    sms_enabled: true,
    email_template: 'Hello Captain,\n\nHere are the passenger details and manifest for your upcoming {trip_type} charter on {trip_date} in {location}.\n\nYou can view passenger names, group sizes, phone numbers, and slip coordination details at the link below:\n\n{details_url}',
    sms_template: 'SplitACharter: View passenger details and slip info for your {trip_type} on {trip_date} ({location}): {details_url}'
  },
  {
    trigger_name: 'matching_timeout', 
    email_enabled: true, 
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nWe apologize, but we were unable to match an available captain for your charter on {trip_date} ({trip_type}).\n\nThe trip has been canceled and your $50 reservation fee has been fully refunded to your original payment method.\n\nYou can view your refund status or book a new date on your dashboard: {dashboard_url}',
    sms_template: 'We were unable to secure a captain for your charter on {trip_date} ({trip_type}). The trip is canceled, and your deposit has been fully refunded.'
  },
  {
    trigger_name: 'unmatched_trip_timeout',
    email_enabled: true,
    sms_enabled: true,
    email_template: 'Hello {customer_name},\n\nWe apologize, but your charter on {trip_date} ({trip_type}) did not find a matching second group before the trip date.\n\nThe trip has been canceled and your $50 reservation fee has been fully refunded to your original payment method.\n\nYou can view your refund details or explore other charter dates on your dashboard: {dashboard_url}',
    sms_template: 'Your charter on {trip_date} ({trip_type}) did not match in time. The trip is canceled and your deposit has been fully refunded.'
  }
];

async function seed() {
  console.log("Upserting all 13 templates to admin_notification_settings...");
  for (const t of templates) {
    const { data, error } = await supabase
      .from('admin_notification_settings')
      .upsert({
        trigger_name: t.trigger_name,
        email_template: t.email_template,
        sms_template: t.sms_template,
        updated_at: new Date().toISOString()
      }, { onConflict: 'trigger_name' });
      
    if (error) {
      console.error(`Error updating ${t.trigger_name}:`, error);
    } else {
      console.log(`✔ Updated ${t.trigger_name}`);
    }
  }

  const { data: finalSettings, error: readErr } = await supabase
    .from('admin_notification_settings')
    .select('trigger_name, email_enabled, sms_enabled, email_template, sms_template')
    .order('trigger_name');
  console.log("\nALL 13 SETTINGS IN DATABASE:");
  console.log(finalSettings.map(s => ({
    trigger: s.trigger_name,
    email_ok: !!s.email_template,
    sms_ok: !!s.sms_template
  })));
}

seed();
