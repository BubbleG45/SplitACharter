# PROJECT_CONTEXT.md — SplitACharter

**Read this file in full before planning or writing any code.** This is the persistent
source of truth for the project. If anything you're about to build contradicts this file,
stop and flag the conflict instead of resolving it silently.

Reference this file in every prompt instead of re-explaining the domain. Do not re-derive
the state machine or the reconfirmation window logic from scratch in any task — both are
defined once, below, and every other part of the system calls into them.

**This file supersedes Developer Specification v6.0 wherever the two disagree.** The spec
PDF is the original product brief, but architectural decisions made after it was written are
tracked here, not back-edited into the PDF. See Section 0 below for the specific places this
applies — check it before trusting an auth/signup detail you recall from the spec.

---

## 0. Where this file overrides the spec — read this first

The spec (Developer Specification v6.0) and this file disagree in exactly one place.
Anywhere else they appear to conflict, treat it as a misreading and re-check both before
assuming a second contradiction exists.

**Auth/signup method.** Spec Section 2 lists Sign Up Options as Google login, Facebook
login, and standard email/password. **This is superseded.** The actual decision, reflected
everywhere else in this file (Section 2) and in both the Development Plan and the Antigravity
Prompt Guide, is **passwordless only: email magic link + SMS OTP**. No password field
anywhere. No Google or Facebook OAuth. If a task's plan proposes social login or a password
field because it pattern-matched on the spec PDF instead of this file, reject the plan.

---

## 1. What this product is

SplitACharter is a marketplace that connects two small groups who want to share a private
boat charter, each paying half the charter price. The platform collects a non-refundable
$50 reservation fee per group via Stripe. The captain is paid directly by each group, in
cash or card, on the day of the trip — SplitACharter never touches charter money in Phase 1.

**Core mechanic:** Listings are reusable templates, not dated events. When a customer picks
a date, the system finds or creates a dated "trip instance" for that template. When two
groups have booked and reconfirmed, an automated text blast goes to every eligible captain
in the database simultaneously. The first to reply YES wins the booking. The instant a trip
reaches 2-of-2 confirmed, a fresh 0-of-2 instance is spawned for the same date/type/location
so there's always something to book — customers should never hit a dead end.

**Phase 1 scope only.** No captain login/portal, no premium captain tiers, no
booking-platform API integrations (FareHarbor etc.), no Stripe Connect/escrow, no reviews,
no multi-language, no native app. If a task seems to need any of these, it's out of scope —
flag it, don't build it.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | **SvelteKit**, deployed via `@sveltejs/adapter-vercel` |
| Database | **Supabase** (managed Postgres) |
| Background jobs | **Inngest** — **not** cron alone, and **not** a self-hosted long-running worker (Vercel functions are short-lived; BullMQ-on-Redis-style persistent workers don't fit this hosting model) |
| SMS | Twilio (Programmable SMS + inbound webhook for replies) |
| Email | **Resend** |
| Payments | **Stripe** Payment Intents (Customer objects from day one, so Connect can be added later without a rebuild) |
| Auth | **Supabase Auth** — passwordless only: email magic link + SMS OTP, with persistent (long-lived) sessions. No password auth, no Google/Facebook OAuth. Session handling via `@supabase/ssr` — never hand-roll session security |
| Hosting | **Vercel** |

**Why SvelteKit specifically:** this site will be used in areas with poor connectivity, and
Svelte compiles away its runtime instead of shipping a framework to the browser — a typical
page ships meaningfully less JS than an equivalent React/Next.js page. That matters directly
for time-to-usable on a weak signal, and SvelteKit's form actions use progressive
enhancement, so booking/payment/reconfirm forms degrade to a plain HTML POST instead of
doing nothing if JS hasn't finished loading. Don't substitute a heavier client-rendered
framework without flagging it — bundle weight is a deliberate, connectivity-driven
constraint here, not a style preference.

**Why Inngest specifically, and why not Supabase's built-in `pg_cron`:** Supabase only ships
a *recurring* scheduler (`pg_cron`, surfaced as "Supabase Cron") — good for "run this every
Monday at 9am," not for "wait exactly 11h42m from now, tied to booking #4821, and let me
cancel it by ID before it fires." Faking the latter with `pg_cron` means a polling sweep
("every minute, check for overdue bookings"), which is the exact anti-pattern Section 5
already rejects. Supabase Edge Functions also have hard execution-time limits, so they can't
sit and wait either. Inngest's step-function model fits the reconfirmation flow directly:
schedule deadline + reminder steps with `step.sleep()` between them, each step checkpoints
independently, and a pending run can be canceled outright the moment both groups reconfirm
early. Do not implement reconfirmation timers as a Postgres/`pg_cron` polling loop — if a
task's plan proposes this, reject it and ask for the Inngest step-function version instead.

**Why passwordless (email magic link + SMS OTP), and an important asymmetry between the two:**
No password means no password-reset flow to build, no credential to forget, and a better fit
for the low-connectivity audience than a typed-password form. But the two channels are *not*
the same mechanism, and a task that treats them as interchangeable will build the wrong UI:

- **Email** sends a true magic link (`signInWithOtp` with the magic-link email template). The
  user taps the link and is signed in directly — no code to read, switch apps for, or type
  back in.
- **Phone/SMS** can *only* send a numeric OTP code, never a clickable link — this is a
  Supabase Auth platform limitation, not a configuration choice. The user receives a 6-digit
  code and must type it into a verification field in the app. Build a real OTP-entry UI for
  the phone path; don't assume the SMS flow can reuse the email flow's "check your inbox and
  click through" screen.

**Phone/SMS login requires a second, separate SMS integration from the one already in this
stack.** Supabase Auth's phone provider is configured at the Supabase project level (Auth →
Providers → Phone) with its own Twilio credentials hookup — this is independent of the
Twilio integration the application code uses for booking/reconfirmation/captain-blast texts.
Don't assume one Twilio account configuration covers both; budget for setting up Supabase's
phone provider as its own task, with its own rate-limit and cost considerations.

**Persistent sessions** means configuring a long refresh-token lifetime in Supabase Auth so
returning customers and admin don't have to re-authenticate on every visit — this is a
session-config detail, not a third login mechanism. Apply it once, at the Supabase Auth
client/session setup level, not per-flow.

Don't substitute a different category of tool elsewhere either (e.g. cron instead of a job
queue, a self-hosted worker instead of a serverless-compatible queue, NoSQL instead of
Postgres) without flagging it first — these choices are load-bearing for the two hard
problems in Section 7.

---

## 3. Core entities and relationships

- **ListingTemplate** — trip type, location, duration, price range (low/high), max
  passengers, description, what's included/to bring, meeting area, active flag. Created
  once per trip type per location; never recreated.
- **TripInstance** — belongs to a ListingTemplate, has a date, a status (see state machine
  below), and a nullable captain reference until matched.
- **Booking** (a "group" on a trip) — belongs to a TripInstance and a Customer. Has group
  size, payment status, reconfirmation status/timestamp, and nullable certification fields
  (dive trip types only).
- **Customer** — profile fields (name, email, phone, SMS opt-in, how-heard-about-us,
  optional city/state/experience/geolocation), strike count, flagged boolean.
- **Captain** — admin-entered only, never logs in. Full entity per spec including
  forward-looking placeholder fields (login credential placeholder, availability calendar
  structure, booking platform name/ID) that are unused in Phase 1 but must exist now so a
  future captain portal doesn't require a data migration.
- **NotificationLog** — every send: recipient, channel, template, content, status,
  timestamp. Suppressed sends (toggle off) are still logged, just marked suppressed.
- **PaymentRecord** — Stripe Payment Intent ID, amount, status, refund history.
- **AdminNotificationSetting** — per-trigger toggle for text/email, independently.

Relationships: ListingTemplate → many TripInstances. TripInstance → up to 2 Bookings, → 0 or
1 Captain. Booking → 1 Customer. Captain is independent, queried by trip type/location/min
notice/active status when a blast fires.

---

## 4. The state machine — do not re-derive this

TripInstance and Booking status are **explicit state fields with defined legal
transitions**, never a loose string set ad hoc. If you're about to add a status value or a
transition that isn't listed here, stop and propose the addition explicitly rather than
just writing it.

### TripInstance states

```
(First Group Pays) ──► half-booked ──────────────► pending-reconfirm
                            ▲                               │
                            │                  ┌────────────┴────────────┐
                            │                  ▼                         ▼
                            │           confirmed                  (one side fails
                            │               │                       to reconfirm)
                            │               ▼                            │
                            │          completed                         │
                            │                                            │
                            └────────── reset to ◄───────────────────────┘
                                     half-booked

 Any state ──► canceled   (admin override, no-match-by-trip-date, no-captain-found,
                            weather cancellation — always a manual review, never automatic)
```

- **Trip Instance Creation** → `half-booked`: created dynamically when the first customer group completes payment.
- `half-booked` → `pending-reconfirm`: second group pays (this triggers the reconfirmation request to both groups).
- `pending-reconfirm` → `confirmed`: both groups reconfirm within their window.
- `pending-reconfirm` → `half-booked` (reset): one group fails to reconfirm. Non-confirmer is forfeited + struck; confirmer's fee is held (see Section 6 — do not auto-refund).
- `confirmed` → `completed`: captain accepted and trip occurred.
- Any state → `canceled`: admin override, no match found by trip date, no captain found after match, or approved weather cancellation. All of these are full automatic refunds except weather cancellation, which is manual-only.

### Booking states (per group, within a TripInstance)

```
pending-payment → paid → awaiting-reconfirm → reconfirmed → (held for captain match)
                                    │
                                    └──► forfeited (failed to reconfirm in window)
```

- A `forfeited` booking always pairs with a strike on that Customer.
- A `reconfirmed` booking whose counterpart `forfeited` does **not** become `canceled` or
  auto-refunded — its fee is `held`, and refund only happens if the customer explicitly
  requests it from their dashboard.

**Illegal transitions must be rejected at the code or DB level** (e.g. an enum/check
constraint, or an explicit transition-table function that throws on an invalid pair), not
just "not expected to happen." This is the single highest-leverage decision in the whole
build — get it right once here, in the schema, not adjudicated ad hoc in five different
places in the codebase.

---

## 5. The reconfirmation window function — do not re-derive this

This must exist as **one pure function**: input is trip datetime + current time, output is
window length and reminder timestamps. No side effects, no DB calls, no scheduling inside
it — every other part of the system calls this function and acts on its output.

| Time until trip | Window | Reminders |
|---|---|---|
| > 72 hours | 24 hours | at 12h remaining, at 2h remaining |
| 48–72 hours | 12 hours | at 6h remaining, at 2h remaining |
| < 24 hours | min(2 hours, time remaining) | at 1h remaining |

General rule underlying the table: reminders fire at 50% of the window elapsed, and again
at 2 hours remaining (or sooner if the window itself is under 2 hours). The table is a
restatement of this rule at specific tiers, not a separate hardcoded set of branches —
implement the percentage logic so it scales automatically rather than hardcoding the three
rows.

**Scheduling is a separate concern from this function.** The function only computes
numbers. Inngest schedules a deadline step and reminder step(s) per booking at match time
(via `step.sleep()` between them in a single durable function), and explicitly cancels the
pending run for that booking the moment both groups reconfirm early. A periodic "check every
minute for overdue bookings" sweep is the wrong implementation, whether built on Inngest or
directly on Supabase's `pg_cron` — it was explicitly rejected during planning because it
can't deliver precise reminder timing or instant cancellation.

---

## 6. Money rules — the part most likely to be misread

The only way a customer loses their $50 is failing to reconfirm within the window. Every
other cancellation scenario is a full automatic refund. Memorize this distinction
specifically, since it's the easiest row to get subtly wrong:

| Scenario | Outcome | Automatic? |
|---|---|---|
| Cancel before reconfirming trip | Full refund | Automatic |
| **Cancels after reconfirming trip** | **$50 forfeited / Non-refundable** | Automatic |
| **Failed to reconfirm — non-confirming group** | **$50 forfeited + strike issued** | Automatic |
| **Failed to reconfirm — confirming group** | **$50 HELD, not refunded** — applies to new match, or refunded only on explicit customer request from dashboard | Held automatically; refund is manual-on-request |
| No match found before trip date | Full refund | Automatic |
| Admin cancels for any reason | Full refund to all groups | Automatic |
| No captain found after match | Full refund | Automatic |
| Weather cancellation | Full refund | **Manual only — never automatic** |

Stripe webhooks (payment success, payment failure, refund confirmation) must be idempotent —
a redelivered webhook with the same event ID should be a no-op, never a double-charge or
double-refund.

---

## 7. The two concurrency problems — never check-then-write

Both of these are database-level atomic operations, not "check in application code, then
insert/update as a second step." A check-then-write has a race window between the check and
the write; under real concurrent load, two requests can both pass the check before either
writes.

1. **Booking capacity (Phase 2).** Two customers can hit "Join Charter" on the same
   half-open trip instance near-simultaneously. Use a DB-level constraint, unique partial
   index, or transactional row lock — never "check group count, then insert" as two steps.

2. **Captain first-acceptance (Phase 4).** Multiple captains can reply YES within the same
   second. Use an atomic conditional update — e.g.
   `UPDATE trip_instance SET captain_id = X WHERE id = Y AND captain_id IS NULL`, checking
   that exactly one row was affected — never "check if captain_id is null, then set it" as
   two steps. Every losing webhook sees the slot already filled and triggers the "claimed"
   text.

If a plan for either of these describes a check followed by a separate write, reject the
plan and ask for the atomic version specifically.

---

## 8. Captain matching basics

Captains are admin-entered only and never log in — there is no captain-facing portal in
Phase 1, only forward-looking placeholder fields on the Captain record for one later. A
blast fires to every captain where: trip type matches, location matches, minimum notice
required is satisfied, and active = true. The blast is simultaneous to all eligible
captains, never sequential. STOP opt-out handling is built into the inbound webhook from
day one, not added later.

---

## 9. Things this build explicitly does NOT include

Do not scope, design, or estimate any of the following — if a task seems to require one of
these, stop and flag it rather than building toward it:

- Captain-facing login or portal of any kind
- Premium captain tier (paid first-access window) or rating-based notification order
- Small-craft-advisory auto-filter on the blast
- Any booking-platform API integration (FareHarbor, Rezdy, Peek Pro, Checkfront, Dockwa)
- Full charter payment collection / Stripe Connect escrow
- Scuba certification verification API, reviews, post-trip questionnaires, in-app
  messaging, multi-language support, native mobile app

Fields and patterns that exist now specifically so these can be added later without a
rebuild (build the field, not the feature): Captain placeholder fields (Section 3), Stripe
Customer-object architecture (Section 2).

---

## 10. How to use this file in a task prompt

Reference it directly rather than re-explaining the domain, e.g.:

> "Per PROJECT_CONTEXT.md section 4, TripInstance status must use the defined state
> machine — do not introduce a new status value without proposing it first."

> "This task touches the reconfirmation window — call the existing pure function from
> PROJECT_CONTEXT.md section 5, do not reimplement the tiered logic inline."

Update this file if and only if the actual spec or an approved architectural decision
changes — not to match whatever an agent happened to build. If a task's Implementation Plan
contradicts this file, the file wins until you decide otherwise.
