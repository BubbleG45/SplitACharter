export interface NotificationTemplateDefinition {
	trigger_name: string;
	label: string;
	description: string;
	email_template: string;
	sms_template: string;
	placeholders: string[];
}

export const DEFAULT_NOTIFICATION_TEMPLATES: Record<string, NotificationTemplateDefinition> = {
	admin_trip_cancellation: {
		trigger_name: 'admin_trip_cancellation',
		label: 'Admin Trip Cancellation',
		description: 'Sent when SplitACharter operations cancels a trip (e.g. weather, mechanical, or operational reasons).',
		email_template:
			'Hello {customer_name},\n\nYour charter reservation on {trip_date} ({trip_type}) has been canceled by SplitACharter operations.\n\nReason for Cancellation:\n{cancellation_reason}\n\nRefund Status:\n{refund_status_text}\n\nYou can view your account and book another date anytime on your dashboard: {dashboard_url}',
		sms_template:
			'SplitACharter Alert: Your charter on {trip_date} ({trip_type}) was canceled. Reason: {cancellation_reason}. {refund_status_text} View details: {dashboard_url}',
		placeholders: ['{customer_name}', '{trip_date}', '{trip_type}', '{cancellation_reason}', '{refund_status_text}', '{dashboard_url}']
	},
	reservation_pending_match: {
		trigger_name: 'reservation_pending_match',
		label: 'Reservation Pending Match',
		description: 'Sent to Group 1 immediately upon successful payment while waiting for a matching second group.',
		email_template:
			'Hello {customer_name},\n\nThank you for your reservation! Your payment has been received for the {trip_type} charter on {trip_date}.\n\nYour group is confirmed and we are actively matching your charter with a second group. Once another group joins, you will receive a notification to reconfirm your trip slot.\n\nYou can view and manage your reservation anytime on your dashboard: {dashboard_url}',
		sms_template:
			'SplitACharter: Your reservation for {trip_type} on {trip_date} is confirmed! We are waiting for a 2nd group to join. Details: {dashboard_url}',
		placeholders: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}']
	},
	match_detected: {
		trigger_name: 'match_detected',
		label: 'Match Detected',
		description: 'Sent to the existing group (Group 1) when a second group books, prompting reconfirmation.',
		email_template:
			'Hello {customer_name},\n\nGood news! A second group has joined your shared charter on {trip_date} ({trip_type}).\n\nPlease reconfirm your attendance within your confirmation window to secure your spot:\n\n{dashboard_url}',
		sms_template:
			'Good news! Your shared charter on {trip_date} ({trip_type}) has been filled. Please reconfirm your attendance on your dashboard: {dashboard_url}',
		placeholders: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}']
	},
	match_auto_reconfirmed: {
		trigger_name: 'match_auto_reconfirmed',
		label: 'Match Auto-Reconfirmed',
		description: 'Sent to the newly joined group (Group 2) confirming automatic reconfirmation upon checkout.',
		email_template:
			'Hello {customer_name},\n\nGreat news! Your booking for the {trip_type} charter on {trip_date} has matched with another group!\n\nSince you just reserved your slot, your group has been automatically reconfirmed. We are now notifying the existing group to reconfirm their slot. Once both groups are locked in, we will notify captains to accept your trip!\n\nYou can view your trip status anytime on your dashboard: {dashboard_url}',
		sms_template:
			'SplitACharter: Your booking for {trip_type} on {trip_date} has matched with another group! Your group is automatically reconfirmed. Details: {dashboard_url}',
		placeholders: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}']
	},
	reconfirm_reminder: {
		trigger_name: 'reconfirm_reminder',
		label: 'Reconfirm Reminder',
		description: 'Automated deadline reminder sent during the reconfirmation window.',
		email_template:
			'Hello {customer_name},\n\nThis is a reminder to reconfirm your charter on {trip_date} ({trip_type}). You have until {deadline_time} to verify your slot.\n\nReconfirm your slot here: {dashboard_url}',
		sms_template:
			'Reminder: Please reconfirm your charter on {trip_date} before the deadline {deadline_time} to secure your slot: {dashboard_url}',
		placeholders: ['{customer_name}', '{trip_date}', '{trip_type}', '{deadline_time}', '{dashboard_url}']
	},
	reconfirm_forfeited: {
		trigger_name: 'reconfirm_forfeited',
		label: 'Reconfirm Forfeited',
		description: 'Sent when a group fails to reconfirm in time; reservation fee forfeited and strike recorded.',
		email_template:
			'Hello {customer_name},\n\nYour charter reservation on {trip_date} ({trip_type}) has been forfeited because you failed to reconfirm before the deadline.\n\nAs per our terms, your $50 reservation fee has been forfeited and a strike has been recorded on your profile.\n\nYou can view your account status on your dashboard: {dashboard_url}',
		sms_template:
			'Your reservation for {trip_date} was forfeited because the reconfirmation window expired. Your deposit has been forfeited. Details: {dashboard_url}',
		placeholders: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}']
	},
	counterpart_forfeited: {
		trigger_name: 'counterpart_forfeited',
		label: 'Counterpart Forfeited',
		description: 'Sent to the confirming group when the other group fails to reconfirm; fee is held for next match.',
		email_template:
			'Hello {customer_name},\n\nThe other group on your charter for {trip_date} ({trip_type}) did not reconfirm in time. As a result, the trip has been reset to Half-Booked so a new group can join.\n\nYour reservation status is active and your $50 reservation fee is held for the next matched group. You will be notified as soon as another group joins.\n\nView details on your dashboard: {dashboard_url}',
		sms_template:
			'SplitACharter: The other group on your {trip_date} charter did not reconfirm in time. Your trip is reset to Half-Booked and your fee is held for the next match. Details: {dashboard_url}',
		placeholders: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}']
	},
	captain_blast: {
		trigger_name: 'captain_blast',
		label: 'Captain Blast',
		description: 'Simultaneous alert sent to all qualified captains when two groups reconfirm a charter.',
		email_template:
			'Hello Captain,\n\nA confirmed shared charter of type "{trip_type}" is available on {trip_date} in {location}.\n\nBoth groups are locked in and ready. The first captain to accept will be awarded this booking.\n\nAccept charter here: {accept_url}',
		sms_template:
			'SplitACharter Alert: A confirmed charter of type "{trip_type}" is available on {trip_date} at {location}. Accept here: {accept_url}',
		placeholders: ['{trip_type}', '{trip_date}', '{location}', '{accept_url}']
	},
	captain_confirmed: {
		trigger_name: 'captain_confirmed',
		label: 'Captain Confirmed',
		description: 'Sent to passengers once a captain accepts the charter, sharing captain info and meeting area.',
		email_template:
			'Hello {customer_name},\n\nGreat news! Captain {captain_name} has accepted your charter on {trip_date} ({trip_type}).\n\nMeeting Area: {meeting_area}\nCaptain Contact: {captain_phone}\n\nYour captain has been provided with your contact details and will reach out to you directly to coordinate any final details before departure.\n\nView trip details: {dashboard_url}',
		sms_template:
			'Match confirmed! Captain {captain_name} will be your skipper on {trip_date} at {meeting_area}. Contact: {captain_phone}. Details: {dashboard_url}',
		placeholders: ['{customer_name}', '{captain_name}', '{captain_phone}', '{meeting_area}', '{trip_date}', '{trip_type}', '{dashboard_url}']
	},
	captain_secured: {
		trigger_name: 'captain_secured',
		label: 'Captain Secured',
		description: 'Sent immediately to the winning captain after they tap Accept Charter.',
		email_template:
			'Congratulations Captain {captain_name}!\n\nYou have successfully secured the charter for {trip_date} ({trip_type}).\n\nPassenger List:\n{passenger_list}\n\nThank you for skippering with SplitACharter!',
		sms_template:
			'Congratulations Captain {captain_name}! You have secured the charter for {trip_date} ({trip_type}). Passenger list: {passenger_list}.',
		placeholders: ['{captain_name}', '{trip_date}', '{trip_type}', '{passenger_list}']
	},
	captain_details_link: {
		trigger_name: 'captain_details_link',
		label: 'Captain Details Link',
		description: 'Provides captain with link to passenger manifest, contact info, and slip details.',
		email_template:
			'Hello Captain,\n\nHere are the passenger details and manifest for your upcoming {trip_type} charter on {trip_date} in {location}.\n\nYou can view passenger names, group sizes, phone numbers, and slip coordination details at the link below:\n\n{details_url}',
		sms_template:
			'SplitACharter: View passenger details and slip info for your {trip_type} on {trip_date} ({location}): {details_url}',
		placeholders: ['{trip_type}', '{trip_date}', '{location}', '{details_url}']
	},
	matching_timeout: {
		trigger_name: 'matching_timeout',
		label: 'Matching Timeout',
		description: 'Sent when no captain accepts before the cutoff window; full refund issued.',
		email_template:
			'Hello {customer_name},\n\nWe apologize, but we were unable to match an available captain for your charter on {trip_date} ({trip_type}).\n\nThe trip has been canceled and your $50 reservation fee has been fully refunded to your original payment method.\n\nYou can view your refund status or book a new date on your dashboard: {dashboard_url}',
		sms_template:
			'We were unable to secure a captain for your charter on {trip_date} ({trip_type}). The trip is canceled, and your deposit has been fully refunded.',
		placeholders: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}']
	},
	unmatched_trip_timeout: {
		trigger_name: 'unmatched_trip_timeout',
		label: 'Unmatched Trip Timeout',
		description: 'Sent when a half-booked trip fails to find a second group before the trip date; full refund issued.',
		email_template:
			'Hello {customer_name},\n\nWe apologize, but your charter on {trip_date} ({trip_type}) did not find a matching second group before the trip date.\n\nThe trip has been canceled and your $50 reservation fee has been fully refunded to your original payment method.\n\nYou can view your refund details or explore other charter dates on your dashboard: {dashboard_url}',
		sms_template:
			'Your charter on {trip_date} ({trip_type}) did not match in time. The trip is canceled and your deposit has been fully refunded.',
		placeholders: ['{customer_name}', '{trip_date}', '{trip_type}', '{dashboard_url}']
	}
};

/**
 * Returns the fallback template definition for a trigger, or undefined if unknown.
 */
export function getDefaultTemplate(triggerName: string): NotificationTemplateDefinition | undefined {
	return DEFAULT_NOTIFICATION_TEMPLATES[triggerName];
}
