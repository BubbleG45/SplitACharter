export interface TestCatalogItem {
	id: string;
	category: string;
	title: string;
	description: string;
	display_order: number;
}

export const MASTER_TEST_CATALOG: TestCatalogItem[] = [
	// ==========================================
	// 1. Public Website & Discovery
	// ==========================================
	{
		id: 'pub-01',
		category: 'Public & Discovery',
		title: 'Homepage Hero & Interactive Carousel',
		description: 'Verify hero messaging, carousel navigation slides, captions, action CTA buttons, and background images across both desktop and mobile viewports.',
		display_order: 10
	},
	{
		id: 'pub-02',
		category: 'Public & Discovery',
		title: 'How It Works Page',
		description: 'Visit /how-it-works. Verify clear explanation of 50/50 split pricing, $50 reservation fee, matching process, and day-of-trip captain payment.',
		display_order: 20
	},
	{
		id: 'pub-03',
		category: 'Public & Discovery',
		title: 'Legal Compliance Disclosures',
		description: 'Verify /terms, /privacy, and /sms-opt-in pages load correctly with accurate legal and SMS disclosure language.',
		display_order: 30
	},
	{
		id: 'pub-04',
		category: 'Public & Discovery',
		title: 'Browse Charters Filters & Search',
		description: 'On /browse, filter by Trip Type, Location, and Duration. Verify cards dynamically filter and display accurate pricing estimates and meeting spots.',
		display_order: 40
	},
	{
		id: 'pub-05',
		category: 'Public & Discovery',
		title: 'Charter Details & Date Picker',
		description: 'Open a charter detail page (/browse/[id]). Select different dates; verify pricing breakdown, passenger limits, included items, and what to bring.',
		display_order: 50
	},
	{
		id: 'pub-06',
		category: 'Public & Discovery',
		title: 'Open Half-Booked Split Visibility',
		description: 'When Group 1 books a charter date, verify that this dated charter appears on /browse with a badge indicating an open split waiting for Group 2.',
		display_order: 60
	},

	// ==========================================
	// 2. Booking & Stripe Checkout Flow
	// ==========================================
	{
		id: 'book-01',
		category: 'Booking & Checkout',
		title: 'First Group Booking (Creation of Half-Booked Trip)',
		description: 'Complete checkout for a new charter date as Group 1 with customer details and test card. Verify trip is created with status "half-booked" and booking status "paid".',
		display_order: 70
	},
	{
		id: 'book-02',
		category: 'Booking & Checkout',
		title: 'Second Group Joining (Transition to Pending-Reconfirm)',
		description: 'From another browser, book the matching open slot for Group 2. Verify trip transitions to "pending-reconfirm" and triggers reconfirmation window.',
		display_order: 80
	},
	{
		id: 'book-03',
		category: 'Booking & Checkout',
		title: 'Passenger Capacity & Max Group Size Constraint',
		description: 'Verify checkout restricts group size to a maximum of 4 (or template limit max_passengers - 1). Verify joining a trip with insufficient remaining capacity is rejected.',
		display_order: 90
	},
	{
		id: 'book-04',
		category: 'Booking & Checkout',
		title: 'Atomic Concurrency on Simultaneous Joins',
		description: 'Simulate two customers hitting "Join Charter" on the same half-booked slot near-simultaneously; verify DB constraint prevents a 3rd group from joining.',
		display_order: 100
	},

	// ==========================================
	// 3. Authentication & Customer Dashboard
	// ==========================================
	{
		id: 'auth-01',
		category: 'Auth & Dashboard',
		title: 'Google OAuth Sign-In',
		description: 'Sign in via Google OAuth on /login. Verify customer record is created/linked and user is redirected to /dashboard.',
		display_order: 110
	},
	{
		id: 'auth-02',
		category: 'Auth & Dashboard',
		title: 'Email Magic Link Sign-In',
		description: 'Enter email on /login. Click the magic link in email inbox; verify direct sign-in with no code entry required.',
		display_order: 120
	},
	{
		id: 'auth-03',
		category: 'Auth & Dashboard',
		title: 'SMS OTP Phone Sign-In',
		description: 'Enter mobile number on /login. Receive 6-digit numeric SMS code and enter into OTP verification field. Verify successful sign-in.',
		display_order: 130
	},
	{
		id: 'auth-04',
		category: 'Auth & Dashboard',
		title: 'Long-Lived Persistent Session',
		description: 'Close browser window, reopen /dashboard; verify user session remains authenticated without prompting for re-login.',
		display_order: 140
	},
	{
		id: 'auth-05',
		category: 'Auth & Dashboard',
		title: 'Customer Dashboard Trip Overview',
		description: 'On /dashboard, verify customer sees active trips, status badges, meeting area, group size, and assigned captain (when matched).',
		display_order: 150
	},
	{
		id: 'auth-06',
		category: 'Auth & Dashboard',
		title: 'Self-Service Reconfirmation Action',
		description: 'When a trip is in "awaiting-reconfirm", click "Reconfirm Booking" on /dashboard. Verify booking status updates to "reconfirmed".',
		display_order: 160
	},
	{
		id: 'auth-07',
		category: 'Auth & Dashboard',
		title: 'Cancellation Before Reconfirming (Full Refund)',
		description: 'Cancel a booking before reconfirming. Verify full automated $50 refund is issued to customer original payment method.',
		display_order: 170
	},
	{
		id: 'auth-08',
		category: 'Auth & Dashboard',
		title: 'Cancellation After Reconfirming (Forfeit)',
		description: 'Attempt to cancel after reconfirming. Verify customer warning that $50 fee is non-refundable and forfeited per policy.',
		display_order: 180
	},
	{
		id: 'auth-09',
		category: 'Auth & Dashboard',
		title: 'Held Fee Refund Request on Dashboard',
		description: 'For a customer whose counterpart forfeited, verify their $50 fee is marked "held" and an explicit "Request Refund" button allows claiming a full refund.',
		display_order: 190
	},

	// ==========================================
	// 4. Reconfirmation State Machine & Timers
	// ==========================================
	{
		id: 'state-01',
		category: 'State Machine & Timers',
		title: 'Reconfirmation Window Pure Function Tiers',
		description: 'Verify window calculation: > 72h out = 24h window (reminders at 12h, 2h); 48-72h = 12h window (reminders at 6h, 2h); < 24h = min(2h, remaining).',
		display_order: 200
	},
	{
		id: 'state-02',
		category: 'State Machine & Timers',
		title: 'Both Groups Reconfirm (2-of-2 Confirmed)',
		description: 'Both groups reconfirm within window. Verify trip instance transitions to "confirmed", deadline timer cancels, and captain matching dispatches.',
		display_order: 210
	},
	{
		id: 'state-03',
		category: 'State Machine & Timers',
		title: 'Group Forfeit & Strike Issuance on Expiry',
		description: 'When reconfirmation window expires with one group failing to confirm: non-confirmer booking marked "forfeited", fee forfeited, and strike recorded in DB.',
		display_order: 220
	},
	{
		id: 'state-04',
		category: 'State Machine & Timers',
		title: 'Trip Reset to Half-Booked Upon Forfeiture',
		description: 'Confirming group has fee held (no auto-refund); trip instance resets to "half-booked" and reappears on /browse for a new group to join.',
		display_order: 230
	},

	// ==========================================
	// 5. Captain Referral Codes & Priority Head-Start
	// ==========================================
	{
		id: 'prio-01',
		category: 'Captain Priority & Promo',
		title: 'Captain Promo Code Validation at Checkout',
		description: 'Enter a captain referral promo code on /checkout. Verify live validation returns green badge with captain name; verify booking stores referring_captain_id.',
		display_order: 240
	},
	{
		id: 'prio-02',
		category: 'Captain Priority & Promo',
		title: 'Priority Window Calculation Tiers',
		description: 'Verify referring captain priority head-start hours: > 7 days = 12h; 3-7 days = 6h; 48-72h = 2h; < 48h = 30 min.',
		display_order: 250
	},
	{
		id: 'prio-03',
		category: 'Captain Priority & Promo',
		title: 'Exclusive Priority Head-Start SMS Alert',
		description: 'When trip reconfirms (2-of-2), verify exclusive priority SMS is dispatched ONLY to the referring captain, while general blast to remaining captains is paused.',
		display_order: 260
	},
	{
		id: 'prio-04',
		category: 'Captain Priority & Promo',
		title: 'Priority Captain Claims Charter within Window',
		description: 'Referring captain replies YES (or clicks accept) during priority window. Verify captain is assigned, confirmations sent, and general blast is never dispatched.',
		display_order: 270
	},
	{
		id: 'prio-05',
		category: 'Captain Priority & Promo',
		title: 'Priority Window Expiry (Fallback to Open Blast)',
		description: 'Referring captain does not claim before priority deadline. Verify Inngest wakes up and sends automated blast to all other eligible captains.',
		display_order: 280
	},
	{
		id: 'prio-06',
		category: 'Captain Priority & Promo',
		title: 'Dual Referring Captains (Both Groups Enter Different Codes)',
		description: 'Group 1 enters Captain A code; Group 2 enters Captain B code. Verify BOTH Captains receive simultaneous priority head-start SMS. First to reply wins.',
		display_order: 290
	},

	// ==========================================
	// 6. Captain Matching & Twilio SMS Workflow
	// ==========================================
	{
		id: 'match-01',
		category: 'Captain Matching & SMS',
		title: 'Simultaneous Captain Blast Query',
		description: 'Verify captain blast selects all captains matching trip type, location, min notice <= departure window, and active = true simultaneously.',
		display_order: 300
	},
	{
		id: 'match-02',
		category: 'Captain Matching & SMS',
		title: 'First-Wins Atomic Acceptance Race Condition',
		description: 'Two captains reply YES simultaneously. Verify atomic DB update assigns Captain 1; Captain 2 receives "Charter already claimed" notification.',
		display_order: 310
	},
	{
		id: 'match-03',
		category: 'Captain Matching & SMS',
		title: 'Winning Captain Details & Manifest Link',
		description: 'Winning captain receives SMS with secure tokenized link to /captain-match/trip-details, displaying passenger roster and slip details.',
		display_order: 320
	},
	{
		id: 'match-04',
		category: 'Captain Matching & SMS',
		title: 'Customer Match Notification with Captain Info',
		description: 'Both booked customer groups receive SMS and email with captain name, contact phone, and specific marina meeting area.',
		display_order: 330
	},
	{
		id: 'match-05',
		category: 'Captain Matching & SMS',
		title: 'Inbound STOP SMS Opt-Out Handling',
		description: 'Send STOP reply to Twilio number. Verify opt-out is recorded and subsequent automated notifications to that phone are blocked.',
		display_order: 340
	},

	// ==========================================
	// 7. System Notifications & Delivery Conditions
	// ==========================================
	{
		id: 'notif-01',
		category: 'Notifications & Templates',
		title: 'reservation_pending_match (Group 1 Paid)',
		description: 'Verify Group 1 receives email and SMS confirmation upon payment stating trip is waiting for a 2nd group, with link to /dashboard.',
		display_order: 350
	},
	{
		id: 'notif-02',
		category: 'Notifications & Templates',
		title: 'match_detected & match_auto_reconfirmed',
		description: 'When Group 2 pays: Group 1 receives match_detected with reconfirmation link; Group 2 receives match_auto_reconfirmed stating they are auto-confirmed.',
		display_order: 360
	},
	{
		id: 'notif-03',
		category: 'Notifications & Templates',
		title: 'reconfirm_reminder Schedule & Placeholders',
		description: 'Verify automated reconfirm_reminder fires at scheduled intervals and accurately formats {deadline_time} and {dashboard_url}.',
		display_order: 370
	},
	{
		id: 'notif-04',
		category: 'Notifications & Templates',
		title: 'reconfirm_forfeited & counterpart_forfeited',
		description: 'Verify non-confirming customer receives reconfirm_forfeited explaining $50 forfeit & strike; confirming customer receives counterpart_forfeited explaining held fee.',
		display_order: 380
	},
	{
		id: 'notif-05',
		category: 'Notifications & Templates',
		title: 'captain_blast & captain_secured Templates',
		description: 'Verify captain_blast contains trip type, date, location, and accept_url. Verify captain_secured delivers passenger manifest to winner.',
		display_order: 390
	},
	{
		id: 'notif-06',
		category: 'Notifications & Templates',
		title: 'matching_timeout & unmatched_trip_timeout',
		description: 'Verify matching_timeout (no captain found) and unmatched_trip_timeout (no 2nd group found before date) deliver cancellation & full refund notices.',
		display_order: 400
	},
	{
		id: 'notif-07',
		category: 'Notifications & Templates',
		title: 'admin_trip_cancellation with Custom Reason',
		description: 'Verify admin cancellation notification delivers custom cancellation reason and accurate refund status text to all passengers.',
		display_order: 410
	},
	{
		id: 'notif-08',
		category: 'Notifications & Templates',
		title: 'SMS Unchecked Suppression & Admin Toggles',
		description: 'Verify customer unchecking SMS opt-in suppresses SMS (email only). In /admin/settings, toggle trigger OFF; verify send is suppressed and logged with status "suppressed".',
		display_order: 420
	},

	// ==========================================
	// 8. Admin Trips & Bookings Management
	// ==========================================
	{
		id: 'adm-trip-01',
		category: 'Admin Trips & Bookings',
		title: 'Filter Trips by Status, Date & Template',
		description: 'On /admin/trips, filter by half-booked, pending-reconfirm, confirmed, completed, and canceled; verify table updates correctly.',
		display_order: 430
	},
	{
		id: 'adm-trip-02',
		category: 'Admin Trips & Bookings',
		title: 'Trip Passenger Manifest & Contacts Inspection',
		description: 'Open /admin/trips/[id]. Verify customer names, emails, phones, and group sizes render for both booked groups.',
		display_order: 440
	},
	{
		id: 'adm-trip-03',
		category: 'Admin Trips & Bookings',
		title: 'Manual Captain Assignment from Dropdown',
		description: 'Assign captain manually in /admin/trips/[id]. Verify captain_id updates, captain gets details link, customers get captain_confirmed notice, and Inngest timers cancel.',
		display_order: 450
	},
	{
		id: 'adm-trip-04',
		category: 'Admin Trips & Bookings',
		title: 'Admin Trip Cancellation (With vs Without Refund)',
		description: 'Test cancellation with refund (processes Stripe refund, inserts refund record, notifies passengers). Test cancellation without refund (bypasses refund).',
		display_order: 460
	},
	{
		id: 'adm-trip-05',
		category: 'Admin Trips & Bookings',
		title: 'Trip Internal Notes Persistence',
		description: 'Enter admin notes on /admin/trips/[id] and click save. Reload page; verify notes persist.',
		display_order: 470
	},
	{
		id: 'adm-trip-06',
		category: 'Admin Trips & Bookings',
		title: 'Customer Communication Audit Log Modal',
		description: 'On trip details, inspect customer notification history; verify matching logs by customer email, phone, and trip date.',
		display_order: 480
	},
	{
		id: 'adm-trip-07',
		category: 'Admin Trips & Bookings',
		title: 'Captains Blast Audit Log Inspection',
		description: 'Open Captains Log on /admin/trips. Verify table showing blasted captains, timestamps, channels, winning indicator, and individual claim links.',
		display_order: 490
	},

	// ==========================================
	// 9. Admin Captain Management
	// ==========================================
	{
		id: 'adm-cap-01',
		category: 'Admin Captains',
		title: 'Create Captain with All Fields',
		description: 'On /admin/captains/new, create captain with Name, Charter Name, Phone, Email, Trip Types, Locations, Min Notice, and Max Passengers.',
		display_order: 500
	},
	{
		id: 'adm-cap-02',
		category: 'Admin Captains',
		title: 'Auto-Derive Captain Promo Code',
		description: 'Leave referral promo code blank when creating captain; verify system auto-generates formatted promo code from Charter/Captain name.',
		display_order: 510
	},
	{
		id: 'adm-cap-03',
		category: 'Admin Captains',
		title: 'Captain Promo Code Uniqueness Check',
		description: 'Attempt to assign a promo code already used by another captain; verify form rejects submission with collision alert.',
		display_order: 520
	},
	{
		id: 'adm-cap-04',
		category: 'Admin Captains',
		title: 'Edit Captain & Deactivate Toggle',
		description: 'Edit captain in /admin/captains/[id]/edit. Toggle active to false; verify captain is excluded from future blasts and promo validations.',
		display_order: 530
	},

	// ==========================================
	// 10. Admin Listing Templates
	// ==========================================
	{
		id: 'adm-tmpl-01',
		category: 'Admin Templates',
		title: 'Create Listing Template & Validations',
		description: 'On /admin/listings/new, create template. Test validation errors for low_price > high_price, non-positive passengers, or missing fields.',
		display_order: 540
	},
	{
		id: 'adm-tmpl-02',
		category: 'Admin Templates',
		title: 'Duplicate / Copy Template Feature',
		description: 'Click "Copy" on an existing template; verify form at /admin/listings/new?copyFrom=ID pre-populates all values for rapid cloning.',
		display_order: 550
	},
	{
		id: 'adm-tmpl-03',
		category: 'Admin Templates',
		title: 'Edit & Toggle Active Status on Template',
		description: 'Edit template details; toggle active to false; verify template disappears from customer /browse page immediately.',
		display_order: 560
	},

	// ==========================================
	// 11. Admin Customer Management & Strikes
	// ==========================================
	{
		id: 'adm-cust-01',
		category: 'Admin Customers',
		title: 'Customer Directory & Booking History',
		description: 'On /admin/customers, view customer list with booking counts, strike tally, and phone/email contacts.',
		display_order: 570
	},
	{
		id: 'adm-cust-02',
		category: 'Admin Customers',
		title: 'Manual Customer Flagging & Unflagging',
		description: 'Click "Flag Customer"; verify customer is marked flagged in DB and blocked from completing checkout on /checkout.',
		display_order: 580
	},
	{
		id: 'adm-cust-03',
		category: 'Admin Customers',
		title: 'Add Manual Strike with Custom Reason',
		description: 'Add manual strike with custom explanation; verify strike increments and displays in customer strike history.',
		display_order: 590
	},
	{
		id: 'adm-cust-04',
		category: 'Admin Customers',
		title: 'Delete Strike & Clear All Strikes',
		description: 'Delete individual strike entry; verify strike count decrements. Test "Clear All Strikes" resetting strike count to 0.',
		display_order: 600
	},

	// ==========================================
	// 12. Admin Payments Ledger & Refunds
	// ==========================================
	{
		id: 'adm-pay-01',
		category: 'Admin Payments Ledger',
		title: 'Payments Ledger Audit Table',
		description: 'On /admin/payments, verify ledger rows show PaymentIntent IDs, amounts, customer names, booking statuses, and refund records.',
		display_order: 610
	},
	{
		id: 'adm-pay-02',
		category: 'Admin Payments Ledger',
		title: 'Manual Refund & Trip State Reset Flow',
		description: 'Click "Refund" on payment record. Verify Stripe API refund, booking canceled, customer notified, and trip re-evaluated/reset to half-booked.',
		display_order: 620
	},
	{
		id: 'adm-pay-03',
		category: 'Admin Payments Ledger',
		title: 'Prevent Duplicate Refunds on Same Transaction',
		description: 'Attempt to refund an already refunded payment record; verify action blocks with "already fully refunded" alert.',
		display_order: 630
	},

	// ==========================================
	// 13. Admin Reports & Analytics
	// ==========================================
	{
		id: 'adm-rep-01',
		category: 'Admin Reports',
		title: 'Performance & Operations Report Tabs',
		description: 'On /admin/reports, test date range presets (Today, This Week, This Month, Custom). Verify metrics for bookings, revenue, and matching rate.',
		display_order: 640
	},
	{
		id: 'adm-rep-02',
		category: 'Admin Reports',
		title: 'Customers & Accounting Reconciliation Tabs',
		description: 'Inspect repeat customer breakdown and accounting reconciliation table (gross charges, refunds, net reservation revenue).',
		display_order: 650
	},
	{
		id: 'adm-rep-03',
		category: 'Admin Reports',
		title: 'Ad-Hoc Query Builder & CSV Export',
		description: 'Run ad-hoc query across bookings, trips, captains, or customers; select custom fields; verify table renders and CSV export downloads.',
		display_order: 660
	},

	// ==========================================
	// 14. Admin Settings & System Controls
	// ==========================================
	{
		id: 'adm-set-01',
		category: 'Admin Settings',
		title: 'Notification Settings Toggles & Custom Wording',
		description: 'In /admin/settings, toggle SMS/Email per trigger; edit email/SMS template wording and save; verify custom template renders in outgoing messages.',
		display_order: 670
	},
	{
		id: 'adm-set-02',
		category: 'Admin Settings',
		title: 'Trip Types Management (Add / Delete / FK Protection)',
		description: 'Add new trip type; verify it appears in listing dropdowns. Attempt to delete a trip type in use; verify foreign key protection alert.',
		display_order: 680
	},
	{
		id: 'adm-set-03',
		category: 'Admin Settings',
		title: 'Landing Page Reviews Management',
		description: 'Seed reviews; add new customer review; verify it displays in testimonials section on homepage. Test toggle active and delete.',
		display_order: 690
	},
	{
		id: 'adm-set-04',
		category: 'Admin Settings',
		title: 'Hero Carousel Slides Management',
		description: 'Add and edit carousel slides with images, captions, CTA links, and object-position. Verify ordering and rendering on public hero.',
		display_order: 700
	},
	{
		id: 'adm-set-05',
		category: 'Admin Settings',
		title: 'Admin Access Delegation & Safeguards',
		description: 'Add new admin email. Test revoking admin access with confirmation prompt. Verify safeguard preventing revoking self or last remaining admin.',
		display_order: 710
	},
	{
		id: 'adm-set-06',
		category: 'Admin Settings',
		title: 'Change Log Tab & Localized UTC Badges',
		description: 'Open Change Log tab in /admin/settings. Verify release notes load from CHANGELOG.md with localized timestamps and month categorization.',
		display_order: 720
	},

	// ==========================================
	// 15. Payment Gateways, Webhooks & Edge Cases
	// ==========================================
	{
		id: 'edge-01',
		category: 'Webhooks & Edge Cases',
		title: 'Stripe Webhook Signature Verification',
		description: 'Send webhook with invalid stripe-signature; verify rejection with HTTP 400.',
		display_order: 730
	},
	{
		id: 'edge-02',
		category: 'Webhooks & Edge Cases',
		title: 'Stripe Webhook Idempotency Guarantee',
		description: 'Send identical Stripe charge webhook twice; verify second delivery returns idempotent=true without creating duplicate charges or alerts.',
		display_order: 740
	},
	{
		id: 'edge-03',
		category: 'Webhooks & Edge Cases',
		title: 'Stripe Payment Failure Handling',
		description: 'Simulate declined card on checkout; verify customer receives error feedback, booking is not marked paid, and no matching logic triggers.',
		display_order: 750
	},
	{
		id: 'edge-04',
		category: 'Webhooks & Edge Cases',
		title: 'SCUBA Certification Field Validation',
		description: 'Book a Scuba Diving charter without agency or certification level; verify validation blocks submission. Book non-scuba charter; verify cert box hidden.',
		display_order: 760
	},
	{
		id: 'edge-05',
		category: 'Webhooks & Edge Cases',
		title: '3-Strikes & Flagged Account Lockout Enforcement',
		description: 'Customer with >= 3 strikes or flagged=true attempts checkout; verify immediate redirect to /account-locked.',
		display_order: 770
	},
	{
		id: 'edge-06',
		category: 'Webhooks & Edge Cases',
		title: 'Invalid & Inactive Promo Code Edge Cases',
		description: 'Enter invalid promo code format or code for deactivated captain; verify clean error feedback without breaking checkout.',
		display_order: 780
	},

	// ==========================================
	// 16. UI Themes & Responsiveness
	// ==========================================
	{
		id: 'ui-01',
		category: 'UI Themes & Styling',
		title: 'Light & Dark Mode Toggle (Anti-FOUC)',
		description: 'Toggle theme across public pages, checkout, customer dashboard, and admin console. Verify localStorage sync and zero FOUC.',
		display_order: 790
	},
	{
		id: 'ui-02',
		category: 'UI Themes & Styling',
		title: 'Mobile Navigation & Sidebar Condensed Mode',
		description: 'Test mobile header drawer and admin sidebar condensed mode (SAC icon, tooltips, responsive layout collapse).',
		display_order: 800
	}
];
