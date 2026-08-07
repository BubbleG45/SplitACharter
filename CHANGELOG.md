# SplitACharter — Plain English Change Log

This change log keeps the site owner up to date on all updates, new features, design enhancements, and bug fixes in plain, simple English.

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
- **Automated Captain SMS Blasts**: Configured instant text notifications dispatched to all eligible captains the moment a trip reaches two confirmed groups.
- **Captain's Log Admin Tools**: Added quick actions in the Admin dashboard to generate and copy direct trip claim links for captains, view claim status, and inspect passenger rosters.
- **Captain Referral Codes & Priority Windows**: Introduced captain referral code support with priority head-start notification timing, updated so that if two groups on the same trip enter different captain codes, **both captains receive simultaneous priority head-start SMS alerts**.
- **Interactive Captain Code Validation & Checkout Safeguard**: Added live real-time promo code validation on the checkout page (verifying active captain status and matching trip location/type), and implemented defensive database fallbacks so mistyped codes or database schema cache issues never block customer checkout.

### 🛠️ Admin Dashboard & Site Owner Tools
- **In-App Trips Data Refresh Button**: Added a dedicated "Refresh Data" button with a spinning indicator and "Updated HH:MM:SS" timestamp to the `/admin/trips` header action bar, allowing site admins to fetch the latest trip instances, bookings, and roster updates instantly without reloading the page or losing active search filters.
- **API Tool Diagnostics Tabs**: Created an interactive API & Services tab in Admin Settings featuring live Stripe status verification (Test/Live mode detector), interactive email template previews, and test notification tools.
- **Reviews Management**: Built an admin review manager on the Settings page to auto-seed, edit, and curate testimonials displayed on the landing page carousel.
- **Trip & Listing Management**: Added quick duplicate, copy, and double-confirmed deletion tools for charter listing templates and dated trip instances.
- **Navigation Enhancements**: Upgraded Admin Settings navigation with a sticky glassmorphic pill menu for easy section jumps.

### 🔐 User Accounts & Profiles
- **SMS & Email Account Consolidation**: Implemented an automated account linking flow to merge guest bookings created via phone number (SMS OTP) and email magic link.
- **Customer Profile Edits**: Allowed customers to update their profile name directly from their customer dashboard.
- **Legal & Footer Pages**: Added dedicated Terms & Conditions and Privacy Policy pages accessible from the site footer.

### 🔧 Fixes & Performance Improvements
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
