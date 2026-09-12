# SplitACharter — Plain English Change Log

This change log keeps the site owner up to date on all updates, new features, design enhancements, and bug fixes in plain, simple English.

---

## 🚀 September 2026

### ⚓ Streamlined Footer Layout & Redundancy Removal — 2026-09-12 17:16 UTC

- **Removed Duplicate Legal Links**: Cleaned up the footer by eliminating the duplicate "Terms • Privacy" links at the bottom right, relying on the prominent "Legal & Policies" column for full access to Terms & Conditions, Privacy Policy, SMS Program, and Cancellation policies.
- **Unified Brand & Copyright Column**: Moved the copyright statement directly beneath the company description in the brand column on desktop, eliminating the unnecessary bottom horizontal divider line and creating a cleaner, modern layout with reduced vertical clutter.
- **Mobile & Tablet Adaptability**: Positioned the copyright notice smoothly at the base of the footer on mobile and tablet screens for natural vertical reading flow.

### 🏠 Admin Navigation to Homepage (`/admin`) — 2026-09-12 17:05 UTC

- **Clickable SplitACharter Brand in Admin Panel**: Updated the SplitACharter logo in the admin navigation sidebar and mobile top bar to link directly back to the public homepage (`/`), providing an easy way for platform administrators to return to the public site without needing to manually edit the URL.
- **Micro-Interactions & Styling**: Added smooth hover transition effects and clean pointer styling while preserving the admin badge and condensed menu indicator.

### 🔢 3-Attempt SMS OTP Retry & Code State Preservation (`/login`) — 2026-09-12 16:59 UTC

- **Three Attempt Allowance on Verification**: Users now get up to 3 attempts to enter the correct 6-digit SMS verification code before being prompted to request a new one, preventing accidental kicks back to the phone number entry screen on typographical errors.
- **Dynamic Attempts Remaining Badge**: The code verification screen clearly displays how many attempts remain (e.g. "2 attempts remaining", "1 attempt remaining") on every incorrect submission.
- **Graceful Lockout Protection**: If a user exhausts all 3 attempts, the interface cleanly routes back to the phone number entry screen with an informative message asking them to request a fresh verification code.
- **One-Click Phone Number Correction**: Added a dedicated "Change phone number" option on the verification screen, allowing users to return to the phone input screen at any time if they realize they typed the wrong phone number.

### 🔗 Automatic Phone Number Sync & Account Linking with Supabase Auth — 2026-09-12 16:54 UTC

- **Linked Existing Accounts to Phone Auth**: Fixed an issue where signing in via SMS OTP created a new unlinked account for users who had already signed up using email or Google OAuth. Existing phone numbers in customer profiles are now linked directly to their primary authentication identities in Supabase Auth.
- **Continuous Phone Number Synchronization**: Updated customer profile editing in the dashboard and reservation checkout to automatically synchronize customer phone numbers with their Supabase authentication record, ensuring future SMS OTP sign-ins immediately match their existing account.
- **Admin & Dashboard Auto-Routing**: Enhanced the SMS OTP verification flow to verify administrative status and route platform administrators to `/admin` and customers to `/dashboard` immediately upon SMS sign-in.

### 📱 Resilient SMS OTP Verification & Auto-Formatting (`/login`) — 2026-09-12 16:47 UTC

- **Automatic Whitespace & Non-Digit Stripping**: Enhanced the SMS verification code input to automatically strip accidental spaces, trailing line breaks, or dashes when users type or paste their 6-digit code.
- **Removed Brittle HTML Pattern Constraint**: Eliminated the restrictive native browser pattern validation that triggered the generic "Please match the requested format" popup whenever a pasted code contained an accidental trailing space.
- **Mobile Number Pad & One-Time-Code Autofill**: Added numeric input mode and one-time code autocomplete hints (`autocomplete="one-time-code"` and `inputmode="numeric"`), enabling iOS and Android devices to display the numeric keypad and autofill the SMS code directly from the keyboard with one tap.
- **Server-Side Token Cleansing**: Strengthened the backend verification action to sanitize incoming verification tokens, ensuring clean numerical codes are passed to Supabase Auth.

### ✅ Collaborative Manual QA Test Plan & Verification Checklist (`/admin/test`) — 2026-09-09 02:42 UTC

- **Dedicated Interactive QA Testing Page (`/admin/test`)**: Launched a collaborative, real-time testing dashboard designed specifically for TJ (the owner) and BG to manually test, verify, and check off every feature across the entire SplitACharter platform.
- **Shared Real-Time Database Persistence**: Built on a dedicated `admin_test_items` database table in Supabase so both TJ and BG can test simultaneously on separate devices (mobile, laptop, tablet) and see each other's checkmarks, notes, and progress in real time.
- **Comprehensive 16-Domain Master Test Catalog**: Pre-populated with 43 exhaustive, step-by-step test cases covering every area of the application:
  - **Public & Discovery**: Browse filters, date pickers, pricing splits, open split visibility, and landing hero slides.
  - **Booking & Stripe Checkout**: Group 1 reservation creation, Group 2 joining, capacity restrictions, and concurrency protections.
  - **Authentication & Customer Dashboard**: Google OAuth, Email Magic Link, SMS OTP, persistent sessions, self-service reconfirmations, and held fee refunds.
  - **Reconfirmation State Machine**: Automated window calculations (24h, 12h, 2h tiers), 2-of-2 confirmation flow, and forfeit/strike/reset rules.
  - **Captain Referral Codes & Priority Head-Start**: Exclusive priority SMS alert dispatch to referring captains before the general blast, dual-captain priority race handling, and fallback to open captain blast upon window expiration.
  - **Captain Matching & Twilio SMS**: Simultaneous captain blast, atomic first-wins claim resolution, winning details manifest links, and STOP opt-out handling.
  - **Notifications & Conditions**: Complete coverage of all 13 email & SMS triggers, placeholder rendering, and suppression conditions.
  - **Complete Admin Functions**: Full testing suites for Trips, Captains, Templates, Customers, Strikes, Payments Ledger, Reports/Ad-Hoc queries, and Settings.
  - **Payment Gateways, Webhooks & Edge Cases**: Stripe webhook signature checks, idempotency guarantees, payment failure simulations, dive certification validations, and account lockout protections.
  - **UI Themes & Responsiveness**: Dark/Light mode toggling, anti-FOUC verification, and mobile drawer layouts.
- **Interactive Checklists & Tester Attribution**: Each test case features an instant checkmark toggle, quick tester attribution pills (`[TJ]` / `[BG]`), and a built-in "Testing as" selector that automatically attributes new checkmarks.
- **Inline Observations & Bug Reporting**: Every test item includes an expandable step-by-step instructions drawer and a free-form notes textarea for testers to document feedback, bug reports, or booking IDs tested.
- **Ad-Hoc Custom Test Creation**: Testers can add custom test cases on the fly with custom categories, titles, and step-by-step instructions.
- **Progress Tracking & Filtering**: Real-time progress bar, percentage completion indicator, tester breakdown counters (TJ vs BG), search bar, and multi-facet filtering (by category, tester, or completion status).
- **Navigation Integration**: Added a prominent "QA Test Plan" navigation link with a checkmark badge to the administrator sidebar menu for quick access.

### 🛠️ Admin Modal Stacking Layering & Twilio SMS Dispatch Diagnostics (`/admin`, `/admin/trips`) — 2026-09-07 16:05 UTC

- **Eliminated Menu Overlap on Admin Modals**: Resolved a CSS stacking context bug where opening any modal in the administration portal (such as the "Cancel Trip Instance" double-confirmation modal, the Captain's Log audit view, or the Status Guide) was partially covered by the dark navigation sidebar menu on the left. Modals, drawers, and backdrops now sit cleanly above the entire screen.
- **Twilio SMS Environment Variable Sanitization**: Added automatic sanitization for all SMS credentials to trim trailing whitespace and strip accidental quotation marks (e.g. `"AC..."` or `'AC...'`) often introduced when pasting credentials into deployment dashboards like Vercel.
- **Robust Twilio Credential Pairing**: Upgraded the SMS dispatch engine to validate and pair credentials intelligently. It automatically pairs API Key SIDs (`SK...`) with API Key Secrets, or Account SIDs (`AC...`) with master Auth Tokens, and gracefully handles swapped environment variables.
- **E.164 Recipient Phone Normalization**: Integrated automatic phone number formatting into the SMS delivery pipeline. Unformatted 10-digit US phone numbers (e.g. `3309903216`) are automatically converted to standard international E.164 format (`+13309903216`) prior to sending, ensuring smooth Twilio delivery.
- **Clear, Actionable Configuration Diagnostics**: When Twilio credentials in the environment are invalid or misconfigured, the dispatch engine now detects the issue before sending and logs a friendly, plain-English diagnostic into the communication history (e.g. explaining that the Account SID must start with `AC` or API Key with `SK`), replacing the previous generic `failed: Authentication Error - invalid username` message.
- **New Twilio Health Diagnostic Endpoint (`/api/debug/twilio`)**: Added a secure diagnostic endpoint for administrators that inspects and reports Twilio environment status (credential prefixes, lengths, mock status, and sender types) with sensitive values masked.

### 🛡️ Administrator Access Management & Role Revocation (`/admin/settings?tab=sec-admin-access`) — 2026-09-07 15:37 UTC

- **Dedicated Admin Access Settings Hub**: Added a new "Admin Access" tab to the Admin Settings dashboard (`/admin/settings?tab=sec-admin-access`). Existing platform administrators can view all currently authorized administrators, check account status, grant administrator privileges to new users, and revoke access.
- **Grant Privileges by Email**: Administrators can grant full administrative rights to any email address. If the individual already has an account, their privileges activate immediately. If they have not registered yet, administrative rights stage securely in the database and activate automatically upon their first sign-in via Google, Email Magic Link, or SMS OTP.
- **Strict Double Confirmation on Revocation**: Added a mandatory two-step double confirmation flow when revoking administrator access. Clicking "Revoke Access" opens a modal explaining the security impact and requires the administrator to explicitly type the target email address (or `REVOKE`) before the final revocation button unlocks, preventing accidental clicks.
- **Self-Lockout Prevention**: Built-in safeguards prevent administrators from accidentally revoking their own access while currently logged in, displaying a clear "You (Current Admin)" status badge.
- **Last-Admin Protection**: The system enforces that at least one administrator account must remain active at all times, preventing accidental platform lockout.
- **Instant Live Synchronization**: Revoking administrator access immediately purges privileges from active database tables, cutting off administrative access on the very next page request.

### 📱 SMS Authentication Error Handling & Phone Number Normalization (`/login`) — 2026-09-07 15:25 UTC

- **Friendly SMS Provider Guidance**: Updated the login flow to detect when Supabase Auth returns the "Unsupported phone provider" error. Instead of displaying a cryptic technical error, the platform now explains that SMS authentication requires the Phone provider to be configured in Supabase Auth settings, and suggests using Email Magic Link or Google sign-in in the meantime.
- **Automatic Phone Format Normalization**: Added automatic phone number sanitization and E.164 normalization on both OTP request and verification forms. Standard 10-digit US phone numbers or numbers with punctuation/spaces are automatically formatted with the appropriate country code before submission.

### 🔔 Admin Notification Settings & Complete Template Population (`/admin/settings?tab=sec-notifications`) — 2026-09-07 15:20 UTC

- **Complete Template Population for All 13 Triggers**: Fully populated both Email and SMS message templates for all 13 notification triggers across the platform (such as Match Detected, Reconfirm Reminder, Captain Blast, Captain Confirmed, Captain Secured, and Trip Cancellations). No notification template in Admin Settings is blank.
- **Fixed Inadvertent Template Deletion Bug**: Resolved an issue in the Admin Settings template editor where disabling an Email or SMS channel toggle added an HTML `disabled` attribute to the text area. Because web browsers do not submit disabled form inputs, saving any setting previously transmitted blank data that unintentionally wiped existing templates to `null` in the database.
- **Always-Accessible Template Editing**: Template text areas now remain permanently visible and editable even when a channel is toggled off, labeled with an intuitive "Channel Inactive" indicator. Administrators can draft and polish message copy at any time before enabling a communication channel.
- **One-Click "Restore Default" Actions**: Added a quick "Restore Default" action next to both Email and SMS editors, allowing administrators to restore the standard system template with a single click if copy is ever accidentally deleted or needs a fresh baseline.
- **Bulk "Fill Defaults" Header Action**: Added a "Fill Defaults" button to the template list sidebar, enabling administrators to bulk-populate any blank or missing templates across all 13 triggers simultaneously.
- **Dispatch Engine Fallback Safeguard**: Enhanced the automated notification delivery engine to automatically fall back to standard built-in templates if a database setting ever lacks message text, preventing lost or dropped customer and captain communications.
- **Database Migration & Seeding**: Added migration `20260907120000_populate_all_notification_templates.sql` to permanently persist all complete notification templates in Supabase.

### 🕒 Change Log Timestamps & Live Admin UI Badges (`/admin/settings?tab=sec-changelog`) — 2026-09-06 19:35 UTC

- **Live Local-Time Badges with UTC Hover Tooltips**: Added timestamp badges with clock icons to the Admin Settings Change Log view. Timestamps automatically format to the viewing administrator's local browser timezone and show the exact UTC timestamp on hover.
- **Dual-Level Timestamp Support**: Enhanced the Change Log markdown parser to extract timestamps at both the category heading level (e.g. `### Feature Name — YYYY-MM-DD HH:mm UTC`) and individual bullet item level (e.g. `- **Update Title** — YYYY-MM-DD HH:mm UTC: Details`), giving administrators precise visibility into when updates occur.
- **Flexible Format Parsing**: Supports both full date/time stamps (`YYYY-MM-DD HH:mm UTC`) and date-only stamps (`YYYY-MM-DD`), accommodating both em-dash (`— 2026-09-06 19:35 UTC`) and bracket (`[2026-09-06 19:35 UTC]`) syntax.
- **Search Integration**: Updated the Change Log keyword filter so administrators can search by timestamp, date, or time in addition to feature keywords.
- **Backfilled September 2026 History**: Backfilled verified git commit timestamps onto all September 2026 updates, ensuring all recent platform changes display exact publish dates immediately.
- **Standardized Maintenance Guidelines**: Updated project rules in `AGENTS.md` and `PROJECT_CONTEXT.md` to mandate inclusion of standard UTC timestamps on all future change log entries.

### 🛡️ Automated Zero-Cost Off-Site Database Backups & Disaster Recovery Runbook (`docs/DISASTER_RECOVERY.md`) — 2026-09-06 18:50 UTC

- **$0/Month Off-Site Automated Backups**: Established an automated, zero-cost disaster recovery workflow via GitHub Actions (`.github/workflows/database-backup.yml`) that runs twice daily (at 02:00 UTC and 14:00 UTC) and supports manual on-demand triggers. It safely dumps, compresses, and uploads encrypted PostgreSQL backups to an independent Cloudflare R2 bucket (within free-tier allowances).
- **Breach & Ransomware Isolation**: Because backup archives are stored on Cloudflare R2 completely independent of Supabase and Vercel, platform data remains 100% recoverable even in the event of a Supabase account takeover, project deletion, or credential compromise.
- **Automated Retention**: Configured the backup pipeline to automatically prune backup archives older than 14 days to keep storage clean and within free limits.
- **Rapid Restoration Helper Script**: Created an emergency database restoration script (`scripts/restore-database.sh`) that restores compressed snapshots to any target PostgreSQL database in under 20 minutes with a single command.
- **Stripe & Background Job Reconciliation**: Documented an external reconciliation procedure to replay Stripe payment webhooks (safely protected against duplicate processing by our idempotent webhook handler) and resync Inngest reconfirmation workflows for any bookings made during the recovery window.

### 📊 Admin Reports & Ad-Hoc Data Explorer (`/admin/reports`) — 2026-09-06 14:47 UTC

- **New Admin Reports Hub**: Added a dedicated, comprehensive analytics and reporting center at `/admin/reports` with direct links from the main Admin Dashboard overview cards and the admin navigation sidebar.
- **Performance Analytics**: Includes sales performance reporting broken down by preset time periods (Today, Yesterday, This Week, Last Week, This Month, Last Month, This Year, Last Year, and custom date ranges). Platform administrators can review gross reservation deposits, processed refunds, net retained sales, passenger counts, and confirmed trips.
- **Sales by Trip Type**: Provides an instant volume breakdown showing booking counts, total passenger groups, and net revenue across every charter activity (e.g. Inshore Fishing, Offshore Fishing, Sunset Cruises, Snorkeling & Diving).
- **Confirmed Charters Audit**: Lists all trips that reached 2-of-2 reconfirmed status, complete with scheduled trip dates, locations, assigned captains and charters, group counts, passenger totals, and deposit totals.
- **Captains Promo Code Use Report**: Built an operational tracker for captain promotional referral codes. Admins can audit each captain's code performance, total bookings referenced, confirmed charters generated, total passengers, and last-used dates.
- **Customer Contact & Profile Directory**: Added a searchable customer directory report displaying customer names, email addresses, direct phone numbers, SMS opt-in status, locations, total bookings, lifetime spend, and account standing.
- **Accounting & Payouts Report**: Added financial auditing tracking gross reservation deposits collected, customer refund details, net platform revenue retained, and automated Stripe bank payout transfers to SplitACharter's bank account.
- **Ad-Hoc Custom Data Pull Builder**: Built an interactive visual query builder allowing administrators to pull custom data on demand. Admins can pick any dataset (Bookings, Trip Instances, Customers, Captains, or Payment Records), select which columns to display, filter by status or keyword, adjust record limits, and preview the live results on screen.
- **One-Click CSV Exports**: Added instant CSV file download buttons to every report table and custom ad-hoc query view so administrators can export data into Excel or spreadsheets in one click.

### ❓ Trip Pricing Range FAQ (`/how-it-works`) — 2026-09-06 14:09 UTC

- **Charter Price Range Explanation**: Added a dedicated, professional FAQ entry to the "How It Works" page addressing why charters display estimated price ranges rather than a single fixed rate. It clearly explains that SplitACharter partners with an independent network of licensed commercial captains who operate distinct vessels of varying sizes, hull designs, amenities (such as air conditioning, private restrooms, shaded deck seating, and premium sound systems), and specialized gear (like tournament fishing tackle or snorkel equipment). It clarifies that the exact rate is locked in as soon as an available captain accepts their confirmed booking, with each group paying their 50% share directly at the dock.
- **Enhanced Multi-Paragraph FAQ Formatting**: Upgraded the FAQ accordion answer display to cleanly support multi-paragraph responses with balanced paragraph spacing across both Adventurer and Captain FAQ sections.

### 🛟 Custom "Man Overboard" 404 Error Page — 2026-09-06 13:57 UTC

- **Interactive "Man Overboard" Rescue Scene**: Created a custom, playful 404 error page for broken or non-existent URLs. Visitors are greeted by a nautical rescue scene with a bobbing life preserver ring and swimmer adrift on gentle ocean swells while the SplitACharter boat cruises safely in the distance.
- **Interactive Lifeline Toss Action**: Visitors can click "Throw Lifeline to Swimmer" (or click directly on the floating life ring) to trigger an animated rope toss that pulls the swimmer safely back to the deck with a celebratory rescue confirmation.
- **Error Page Hydration Safeguard**: Safely guarded root layout authentication listeners during error boundaries, ensuring client-side interactivity and animations initialize without hydration interruption.
- **Safe Return Navigation**: Prominently features clear recovery actions ("Return to Safe Harbor" to head home and "Find an Active Charter" to browse trips), along with friendly captain's advice so visitors never feel stranded.
- **Light & Dark Theme Seamless Compatibility**: Built entirely with our semantic theme variables for seamless, high-contrast readability across both Light Mode and Dark Mode with zero layout flash.

### 🗂️ Customer Dashboard Trip Archiving & Date Sorting (`/dashboard`) — 2026-09-06 13:50 UTC

- **Trip Date Sorting**: Added an instant trip date sort dropdown to the customer reservations dashboard. Customers can sort their charter reservations by "Trip Date: Soonest first" (default) or "Trip Date: Latest first", with their preference automatically remembered across visits via local browser storage.
- **Archive & Hide Old Trips**: Allowed customers to archive and hide inactive or past charter trips (completed, canceled, forfeited, or past scheduled dates) to keep their active dashboard view clean and decluttered. Active upcoming reservations requiring attendance reconfirmation cannot be archived to safeguard customers from missing trip notifications.
- **Collapsible Archived Trips Drawer**: Added an expandable accordion drawer at the bottom of the dashboard titled "Archived Trips" showing total archived trip count. Customers can open the drawer anytime to review their past charter details, copy booking references, or click "Unarchive Trip" to restore a trip back to their active reservations list.
- **Device-Synced Archive Persistence**: Integrated database-backed archive state tracking so archived trips remain cleanly synchronized across any device, browser, or login session.

### 📸 Home Page Photo Carousel & Content Management — 2026-09-06 13:06 UTC

- **Photo Crop Repositioning & Focal Alignment**: Added vertical and horizontal focal alignment controls (`Center`, `Top Focus`, `Bottom Focus`, `Left Focus`, `Right Focus`) to both the Add Slide and Edit Slide forms. When widescreen 16:9 cropping cuts off photo subjects (like boat masts, skyline, or boat decks), administrators can adjust the focal alignment with instant real-time live preview.
- **Recommended Photo Specifications Banner**: Added an informational guidelines card to the slide creation and editing interface outlining optimal dimensions (16:9 widescreen, 1920×1080px or 1280×720px), landscape orientation advice, and file limits (up to 5MB).
- **Auto-Scroll to Edit Form & Visual Focus**: Updated the slide management list so that clicking "Edit" or "+ Add New Photo Slide" smoothly scrolls the viewport directly up to the form and illuminates it with a glowing focus ring, making it immediately obvious that the editor has opened.
- **Interactive Home Page Photo Carousel (`/`)**: Added a prominent, auto-playing photo showcase carousel positioned directly between the hero section and guest review stories. Features smooth 5-second automatic rotations, pause-on-hover, previous/next arrow controls, direct-jump slide indicators, mobile touch-swipe gestures, and text cards with adventure titles, descriptive captions, and "Explore Charters" action buttons.
- **Admin Photo Carousel Management (`/admin/settings?tab=sec-carousel`)**: Created a dedicated "📸 Photo Carousel" section within Admin Settings for platform operators. Administrators can upload new photo files directly to a dedicated Supabase Storage bucket (`carousel-images`) with live image preview and automatic 5MB file validation, or link to external image URLs. Admins can update slide titles, captions, destination links, button text, and custom display orders, as well as toggle individual slides active or hidden instantly without page reloads.
- **Live In-Admin Carousel Preview**: Added a real-time, interactive carousel simulator within the Admin Settings panel so administrators can test slide transitions, captions, and layouts before publishing.
- **Starter Charter Adventures Pre-Seeded**: Automatically pre-populated four high-resolution starter slides showcasing Key West sunset sailing, offshore sportfishing, sandbar & eco charters, and coral reef diving.

- **Captain Email Notification Dispatch Support**: Updated all captain blast and captain assignment notification dispatchers (`functions.ts`, `trips.ts`, accept route, and admin dispatch tools) to query captain email addresses and pass them to the notification delivery engine. Captains can now receive automated email notifications (in addition to SMS) whenever the Email Channel is enabled in Admin Settings.
- **Background Match Notification URL Resolution Fix**: Updated the Inngest background matching engine to dynamically resolve the site's live domain (`https://splitacharter.boats` or configured deployment URL) via `getSiteUrl()`, preventing automated captain notification links from defaulting to `http://localhost:5173`.
- **Admin Settings Notification Template Channel Reactivity Fix (`/admin/settings`)**: Fixed an issue in the notification settings manager where enabling a previously inactive notification channel (such as the Email Channel on Captain Blast) left the message template textarea disabled and uneditable. Upgraded the settings state management to Svelte 5 reactive proxies so that checking or unchecking channel toggles instantly unlocks the template fields and lets administrators type, edit, and save email and SMS body templates seamlessly.
- **Captain Blast & Trip Confirmation Schema Query Fix**: Fixed an issue where the trip confirmation and captain blast dispatch failed silently when the second booking reconfirmed due to a legacy query referencing an unmigrated database column (`referring_captain_id`). Updated the trip confirmation query in `trips.ts` and the Inngest background matching function to ensure trips seamlessly transition to `Confirmed` and dispatch automated captain SMS text blasts immediately. Confirmed and dispatched captain notifications for stuck trips.
- **Admin Trips Dashboard Loading Fix (`/admin/trips`)**: Resolved an issue causing a 500 "Failed to load trip instances" error when visiting the Admin Trips management dashboard. The query now explicitly specifies the assigned captain relationship when loading trip instances, resolving database query ambiguity introduced after adding referring captain support so administrators can view, filter, and manage all charter trip instances and captain logs without errors.
- **Interactive Column Heading Sorting for Trips & Bookings (`/admin/trips`)**: Added instant column header sorting to the charter trips management dashboard. Administrators can click on any column heading in the master table (`Date`, `Charter Specs`, `Assigned Captain`, `Bookings`, and `Status`) to sort trips in ascending or descending order with visual directional indicators (`▲`, `▼`, `↕`). In addition, clicking on any column header in the nested customer bookings table (`Customer Name`, `Contact Details`, `Group Size`, `Booking Status`, and `Created Date`) immediately sorts all attendee bookings across trips.
- **Trip Instance Generation Policy Update**: Clarified and aligned the system rules so fresh trip instances are not automatically spawned upon a trip reaching confirmed status.

### 🧭 Browse & Search Experience — 2026-09-02 14:36 UTC

- **Browse Banner 1-of-2 Clarification (`/browse`)**: Updated the informational banner headline and subtext shown when browsing without a selected date to "Charters with 1 of 2 Groups Booked — Join & Confirm Instantly" ("These trips are 50% filled. Join as the 2nd group to confirm right away, or select a trip date above to start a fresh trip."). This clearly communicates to visitors that a group is already waiting and that joining confirms the charter immediately.

### 🔐 User Accounts & Authentication — 2026-09-02 13:30 UTC

- **Customer Dashboard Header Streamlining (`/dashboard`)**: Removed the redundant "SplitACharter Portal" pill badge above the welcome greeting for a cleaner, modern customer dashboard presentation.
- **Google OAuth Sign-In Option (`/login`)**: Added a prominent "Continue with Google" sign-in option to the login page alongside the existing passwordless Email Magic Link and SMS OTP methods. Users can now securely authenticate with a single click using their Google account. New customers signing in with Google are automatically registered in the system, and authenticated users are seamlessly routed to their dashboard or admin portal.
- **Admin Session Privileges Fix**: Upgraded server-side session resolution in `hooks.server.ts` to query admin access using elevated database permissions, guaranteeing that newly signed-in administrators immediately receive their admin privileges and dashboard navigation link regardless of database Row Level Security policies.
- **Instant Reactive Admin Header Sync**: Added automatic server data invalidation (`depends('supabase:auth')`) to the root layout so that when an administrator logs in, the navigation bar instantly updates to display "Admin Dashboard" without requiring a manual browser refresh.
- **Dark Mode Toggle Responsiveness Fix**: Fixed an issue where background auth listener cycles during Google OAuth session initialization could interfere with theme switching. Made the theme store DOM attribute and storage updates direct and synchronous for instant, reliable toggling across all authentication states.

### 💳 Payments & Admin Tools — 2026-09-03 13:00 UTC

- **Public Checkout Preview & Guest Authentication Guard (`/checkout`)**: Made the reservation checkout page publicly viewable so that visitors and carrier compliance reviewers can inspect the full booking form, customer profile fields, and SMS opt-in disclosures directly at `https://www.splitacharter.boats/checkout` without encountering an authentication redirect. Kept booking reservation deposits and finalized checkout strictly guarded by authentication, prompting unauthenticated users to sign in with email magic link or SMS OTP before submitting payment.
- **Payments Ledger Stripe Refund Execution & Validation (`/admin/payments`)**: Upgraded the manual refund action on the payments ledger to ensure refunds always trigger live Stripe API refunds directly, report clear error alerts if Stripe rejects a request, execute using secure admin client database access, and properly respect cancellation in the confirmation dialog.
- **Payments Ledger Trip Date Timezone Display Fix (`/admin/payments`)**: Fixed a date rendering issue on the admin payments ledger where charter trip dates were inadvertently shifted to the previous day in US time zones due to standard UTC date parsing. Dates now consistently display the exact scheduled charter date across all user time zones.

### 📱 SMS Messaging & Carrier Compliance (A2P 10DLC) — 2026-09-02 01:05 UTC

- **Public SMS Program & Opt-In Verification Page (`/sms-opt-in`)**: Created a dedicated, 100% publicly accessible compliance page containing our full SMS Program Policy, message specifications, frequency, rate disclaimers, STOP/HELP instructions, and an uncropped visual replica and screenshot of our checkout opt-in workflow. This allows wireless carrier compliance reviewers (TCR / Twilio) to verify our SMS consent collection immediately without running into private login or authentication screens.
- **Hosted Opt-In Screenshot Proof (`/sms-opt-in-proof.png`)**: Added a direct public high-resolution visual screenshot asset demonstrating the customer profile fields, unchecked consent checkbox, and disclosure copy for direct carrier audit verification.
- **Footer Navigation Update**: Added the "SMS Program & Opt-In" link to the site-wide footer under "Legal & Policies".

---

## 🚀 August 2026

### 🎨 Design & Social Sharing

- **Social Media Cards (OpenGraph Preview)**: Created high-resolution social preview banner images (`og-image.png`) featuring the official SplitACharter logo so shared links on Facebook, iMessage, X, and WhatsApp look crisp and professional.
- **Light & Dark Theme Toggle**: Added a full Light Mode and Dark Mode theme toggle with persistent user preferences, ensuring full high-contrast readability across all pages, badges, and dropdowns.
- **Landing Page Customer Review Marquee**: Added an animated customer review carousel on the homepage to highlight authentic feedback.
- **PWA Support**: Enabled Progressive Web App (PWA) manifest and service worker capabilities for seamless mobile web app behavior.

### 💳 Payments & Checkout

- **Embedded Stripe Payment Element**: Built a direct inline Stripe credit card checkout experience on the `/checkout` page.
- **Test Mode Helpers**: Added a prominent Test Mode banner on checkout with instant click-to-autofill test credit cards and a quick copy button for testing payments.
- **Browser Autofill Integration**: Enabled native browser autofill for card details and customer contact information during checkout.
- **SCUBA & Freediving Certification Panels**: Added conditional certification disclaimers and requirement checklists for diving charter listings.
- **Capacity Guards**: Updated checkout and capacity rules to strictly limit groups to a maximum of 4 passengers and automatically manage open seats.

### 🚤 Captains & Dispatch System

- **Charter Name & Custom Memorable Referral Codes**: Added a dedicated "Charter / Boat Business Name" field to captain creation and edit forms. The system automatically converts the charter name into a clean, memorable, URL-safe referral promo code in ALL CAPS (e.g. "Salty Dog Charters" $\rightarrow$ `SALTY-DOG-CHARTERS`), while still allowing site admins to manually customize or re-sync the code.
- **Duplicate Code Safeguard**: Implemented case-insensitive uniqueness validation on captain forms and database records to prevent duplicate promo codes from being assigned to multiple captains.
- **Referral Link Pre-Filling (`?ref=CODE`)**: Added support for captain referral links across browse, charter details, and checkout pages. When customers visit via a captain's link (e.g. `/browse?ref=SALTY-DOG-CHARTERS`), the referral code is automatically carried through and validated on checkout with an applied status badge, and the "How Did You Hear About Us?" field defaults to "Captain Referral".
- **One-Click Share & Copy Tools in Admin**: Added quick-copy buttons for referral promo codes and direct customer booking links directly in the Registered Captains table (`/admin/captains`).
- **Automated Captain SMS Blasts**: Configured instant text notifications dispatched to all eligible captains the moment a trip reaches two confirmed groups.
- **Captain Referral Codes & Priority Windows**: Introduced captain referral code support with priority head-start notification timing, updated so that if two groups on the same trip enter different captain codes, **both captains receive simultaneous priority head-start SMS alerts**.
- **Twilio SMS Notification Engine**: Switched outbound SMS messaging provider to Twilio Programmable Messaging with support for secure standard Twilio API Keys (`SK...` + Secret) and Messaging Service SIDs (`MG...`), enabling cost-effective pay-as-you-go transactional texting for instant captain blasts, customer reconfirmation reminders, and booking alerts while providing native unified compatibility with Supabase phone authentication.
- **Interactive Captain Code Validation & Checkout Safeguard**: Added live real-time promo code validation on the checkout page (verifying active captain status and matching trip location/type), and implemented defensive database fallbacks so mistyped codes or database schema cache issues never block customer checkout.

### 🛠️ Admin Dashboard & Site Owner Tools

- **In-App Trips Data Refresh Button**: Added a dedicated "Refresh Data" button with a true circular double-arrow icon, spinning animation indicator, and "Updated HH:MM:SS" timestamp to the `/admin/trips` header action bar, allowing site admins to fetch the latest trip instances, bookings, and roster updates instantly without reloading the page or losing active search filters.
- **API Tool Diagnostics Tabs**: Created an interactive API & Services tab in Admin Settings featuring live Stripe status verification (Test/Live mode detector), interactive email template previews, and test notification tools.
- **Reviews Management**: Built an admin review manager on the Settings page to auto-seed, edit, and curate testimonials displayed on the landing page carousel.
- **Trip & Listing Management**: Added quick duplicate, copy, and double-confirmed deletion tools for charter listing templates and dated trip instances.
- **Admin Settings Tab Bar Layout & Reordering**: Upgraded the `/admin/settings` navigation pill bar to wrap cleanly as part of the page container so all tabs are visible on all screen sizes, and moved the **Email Previews** tab directly after **Notifications**.

### 🔐 User Accounts & Profiles

- **Carrier-Compliant SMS Opt-in Disclosures & Domain Alignment (`splitacharter.boats`)**: Added clear, carrier-approved (A2P 10DLC / CTIA) opt-in disclosures directly on the public login page (`/login`) and reservation checkout screen (`/checkout`). Expanded Section 6 of Terms & Conditions into complete SMS Program Terms detailing use cases (OTP verification, match notifications, reconfirmations), message frequency, rate disclaimers, HELP/STOP keywords, and updated all support email references to `info@splitacharter.boats`.
- **Dedicated Account Locked Page & Checkout Strike Protection**: Created a dedicated, user-friendly `/account-locked` notification page informing customers if their account has been suspended due to reaching the 3-strike limit. If a customer with 3 or more strikes attempts to open the checkout page, the system immediately redirects them to this informative locked screen with clear explanation of the policy, account status details, support contact links (`support@splitacharter.boats`), and appeal instructions instead of presenting a failing payment form.
- **SMS & Email Account Consolidation**: Implemented an automated account linking flow to merge guest bookings created via phone number (SMS OTP) and email magic link.
- **Customer Profile Edits**: Allowed customers to update their profile name directly from their customer dashboard.
- **Legal & Footer Pages**: Added dedicated Terms & Conditions and Privacy Policy pages accessible from the site footer, including strict carrier-compliant disclosures ensuring mobile information and SMS consent are never shared with third parties or affiliates for marketing or promotional purposes.

### 🔧 Fixes & Performance Improvements

- **Checkout Double-Submission & Duplicate Trip Instance Fix**: Resolved a frontend submission race condition where clicking checkout could send duplicate concurrent requests to the server, preventing duplicate charter instances from being created and ensuring customers only receive single, relevant confirmation notifications.
- **Per-Group Max Passenger Cap Enforcement**: Enforced single-group passenger caps across browse, trip details, and checkout endpoints so group sizes for brand new charter instances leave at least 1 open seat for the matching group (e.g. Flyfishing charters with total capacity 2 are strictly capped at 1 passenger per group signup).
- **Capacity Check RLS Safeguards**: Fixed booking capacity counts to ignore abandoned or pending-payment checkouts, preventing false "sold out" errors.
- **Database RLS Admin Bypass**: Switched background admin operations to secure admin client execution, eliminating permission errors during trip cancellations and listings updates.
- **Dynamic Domain Resolution**: Ensured server-rendered URLs and social preview cards adapt dynamically to the active deployment environment (Vercel production or staging).

---

## 📜 Project Inception & Core Foundation

- **Platform Architecture**: Built the core SplitACharter marketplace using SvelteKit, Supabase (managed Postgres), Stripe, Twilio SMS, and Resend Email.
- **Passwordless Security**: Established 100% passwordless authentication via Email Magic Links and Twilio SMS 6-digit verification codes.
- **Automated 2-of-2 Group Matching**: Implemented reusable charter templates that automatically spawn dated trip instances when groups book a date.
- **Automated Reconfirmation Logic**: Engineered reconfirmation deadline timers (24h, 12h, and 2h windows) using Inngest step functions to handle group reconfirmations and refunds fairly.

### Push Update — 2026-08-07 21:59 UTC (b6bcb9f)

- Fix checkout captain code validation and add defensive schema fallback

### Push Update — 2026-08-07 22:03 UTC (959fcb1)

- docs: update CHANGELOG.md with captain promo code validation changes

### Push Update — 2026-08-07 22:15 UTC (6eaf083)

- feat: support simultaneous priority dispatch for multiple referring captains on a trip

### Push Update — 2026-08-07 22:24 UTC (6e6927f)

- feat: add manual Refresh Data button and timestamp to admin trips page

### Push Update — 2026-08-07 22:31 UTC (f59b81d)

- feat: add Change Log tab to Admin Settings and optimize mobile responsiveness across admin dashboard

### Push Update — 2026-08-07 22:34 UTC (3a1ed58)

- fix: render Change Log template block in admin settings page

### Push Update — 2026-08-07 22:39 UTC (0985ec6)

- fix: bundle CHANGELOG.md via Vite raw import and remove Change Log from main sidebar menu

### Push Update — 2026-08-07 22:42 UTC (45d182b)

- docs: add mandatory CHANGELOG.md maintenance rules to AGENTS.md and PROJECT_CONTEXT.md

### Push Update — 2026-08-07 22:45 UTC (39aebab)

- fix: change settings nav pill bar to relative positioning to prevent floating over content

### Push Update — 2026-08-07 22:54 UTC (4bb2ab9)

- fix: enforce max per-group passenger cap on browse and checkout routes

### Push Update — 2026-08-07 23:08 UTC (1381b40)

- style: wrap admin settings tab bar and place Email Previews right after Notifications

### Push Update — 2026-08-07 23:46 UTC (ec27cba)

- fix: prevent checkout double-submission and duplicate trip instance creation

### Push Update — 2026-08-19 16:03 UTC (1406ccc)

- feat: add account locked page and redirect 3-strike customers from checkout

### Push Update — 2026-08-19 16:32 UTC

- feat: add charter business name and auto-generated memorable referral codes to captains
- feat: support captain referral link pre-filling (?ref=CODE) across browse and checkout
- fix: update admin trips Refresh Data button icon to curved semicircle double arrows

### Push Update — 2026-08-19 16:32 UTC (c46c79c)

- feat: add captain charter business name, memorable referral codes, and ref URL auto-linking

### Push Update — 2026-08-19 21:17 UTC (620661d)

- feat(sms): switch SMS engine to Twilio with API key support and update privacy policy

### Push Update — 2026-08-27 23:07 UTC (7ef9b11)

- Add carrier-compliant A2P 10DLC SMS opt-in disclosures and align support domain to splitacharter.boats

### Push Update — 2026-09-02 01:05 UTC (ff9dc63)

- Add public SMS program and opt-in verification page with hosted screenshot for 10DLC compliance

### Push Update — 2026-09-02 01:08 UTC (966cadb)

- Update SMS opt-in proof screenshot to explicitly display splitacharter.boats in address bar

### Push Update — 2026-09-02 01:16 UTC (efcb03b)

- Fix timezone date display and Stripe refund execution on admin payments ledger

### Push Update — 2026-09-02 13:30 UTC (09cea26)

- feat(auth): add Google OAuth sign-in option

### Push Update — 2026-09-02 13:38 UTC (866d3a9)

- fix(auth): use service role client for admin lookup in hooks.server.ts

### Push Update — 2026-09-02 13:50 UTC (2922252)

- Update browse page banner headline for clarity

### Push Update — 2026-09-02 13:57 UTC (65adee1)

- fix(auth): add depends('supabase:auth') to +layout.server.ts for instant reactive admin header sync

### Push Update — 2026-09-02 14:36 UTC (c65d51e)

- Clarify browse banner 1-of-2 messaging and streamline dashboard header

### Push Update — 2026-09-02 14:41 UTC (922a5c0)

- fix(theme): ensure immediate synchronous DOM updates and stop auth listener invalidation loops

### Push Update — 2026-09-02 15:21 UTC (7a179ac)

- fix(settings): restore reactivity for notification template channel toggles and update captain blast dispatch

### Push Update — 2026-09-02 15:37 UTC (c9fc693)

- fix(notifications): pass captain email to notification engine and resolve live site url in Inngest matching

### Push Update — 2026-09-03 17:01 UTC (a280607)

- Allow public checkout preview with uncropped opt-in form while requiring authentication to finalize bookings

### Push Update — 2026-09-06 17:06 UTC (18cd91a)

- feat: add home page photo carousel with admin settings management

### Push Update — 2026-09-06 17:15 UTC (ce7e228)

- fix: update sandbar carousel image with verified working url and fallback handlers

### Push Update — 2026-09-06 17:29 UTC (7bc6d96)

- feat: add photo focal repositioning, recommended sizing guidelines, and edit auto-scroll

### Push Update — 2026-09-06 17:37 UTC (e34932a)

- fix: disambiguate captains foreign key relationship on admin trips queries

### Push Update — 2026-09-06 17:50 UTC (7b5c22c)

- Add trip archiving and trip date sorting to customer dashboard

### Push Update — 2026-09-06 17:57 UTC (0729be9)
- feat: add custom Man Overboard 404 error page with interactive lifebuoy rescue

### Push Update — 2026-09-06 18:02 UTC (a217810)
- fix: resolve hydration crash on error page and ensure lifeline clicks work

### Push Update — 2026-09-06 18:10 UTC (b553255)
- Add charter price range explanation to FAQ and update change log

### Push Update — 2026-09-06 18:47 UTC (8208042)
- feat(admin): add admin reports hub and ad-hoc custom data explorer

### Push Update — 2026-09-06 19:36 UTC (d896127)
- feat: add timestamps to change log UI and establish automated off-site database backups

### Push Update — 2026-09-07 15:38 UTC (f140098)
- feat(admin): add admin access management with double confirmation revocation

### Push Update — 2026-09-07 16:01 UTC (76a209a)
- fix: resolve admin modal sidebar menu overlap and improve Twilio SMS auth error handling

### Push Update — 2026-09-09 02:43 UTC (d57886a)
- feat: add collaborative manual QA test plan checklist page (/admin/test)

### Push Update — 2026-09-12 16:48 UTC (49e0c15)
- fix(auth): sanitize sms otp input and strip whitespace to prevent validation error

### Push Update — 2026-09-12 16:54 UTC (c2b7f1c)
- feat(auth): auto-sync customer phone numbers to auth.users and fix sms otp account linking

### Push Update — 2026-09-12 16:59 UTC (78835c4)
- feat(auth): allow 3 attempts on sms verification code before resetting

### Push Update — 2026-09-12 17:05 UTC (20e5324)
- feat: link SplitACharter logo in admin navigation to homepage

### Push Update — 2026-09-12 17:18 UTC (b5df2e5)
- refactor: streamline footer layout, remove duplicate legal links, and integrate copyright into brand column
