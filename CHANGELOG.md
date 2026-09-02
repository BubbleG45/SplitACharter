# SplitACharter — Plain English Change Log

This change log keeps the site owner up to date on all updates, new features, design enhancements, and bug fixes in plain, simple English.

---

## 🚀 September 2026

### 💳 Payments & Admin Tools
- **Payments Ledger Stripe Refund Execution & Validation (`/admin/payments`)**: Upgraded the manual refund action on the payments ledger to ensure refunds always trigger live Stripe API refunds directly, report clear error alerts if Stripe rejects a request, execute using secure admin client database access, and properly respect cancellation in the confirmation dialog.
- **Payments Ledger Trip Date Timezone Display Fix (`/admin/payments`)**: Fixed a date rendering issue on the admin payments ledger where charter trip dates were inadvertently shifted to the previous day in US time zones due to standard UTC date parsing. Dates now consistently display the exact scheduled charter date across all user time zones.

### 📱 SMS Messaging & Carrier Compliance (A2P 10DLC)
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
