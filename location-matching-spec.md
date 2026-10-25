# Business rules: Charter locations and captain matching

**Project:** splitacharter.boats (Supabase)

**Goal:** Replace the three hard-coded Keys areas (and any hard-coded charter types and durations) with data the admin manages, so that:

1. Customers see a realistic drive time from where they're staying to the marina their charter leaves from.
2. Captains are only notified about requests they can actually run: in their area, for a charter type they offer, and for a duration they offer. A Key West captain never gets a Miami request.
3. The business can expand to new areas (e.g. Miami) by adding data in the admin, not by changing code.
4. Customers can request any listed charter, even where there's no captain yet. Those requests are flagged for the admin, who recruits a captain.

> **Note to implementer:** This document describes *what* the system must do. The data model, database logic, notifications and migration approach are up to you. Fit them to the existing schema and code, and extend what already exists rather than duplicating it.

---

## 1. Core concepts

- **Area:** a region customers choose from, e.g. "Lower Keys" or "Miami – Biscayne Bay". Areas are managed by the admin and can exist with no marinas or captains yet.
- **Marina:** a real place a charter leaves from, with an address and map location. Managed by the admin. A marina belongs to one or more areas (a marina near a boundary can serve two).
- **Charter type:** e.g. Fishing, Sandbar, Snorkel. Managed by the admin.
- **Duration:** e.g. Half day, Full day. Managed by the admin.
- **Ghost charter (listing):** what customers browse and pick. There is one listing for each **area × charter type × duration** combination. A listing is a catalog entry, not a real trip.
- **Request:** a customer's split charter for a specific listing and date, which other customers can join.
- **Captain:** runs their boat from a single marina, and offers certain charter types and certain durations.

---

## 2. Listings (ghost charters)

- Listings exist for every combination of active area, charter type and duration.
- When the admin adds a new area, type or duration, the missing listings are created automatically.
- The admin can set listing details (such as price) and switch off combinations that don't make sense. Listings that have been used by requests are switched off, never deleted.
- Customers browse and filter listings by area, type and duration, the same as today but driven by admin-managed data.
- Customers never see whether a listing has a captain.

---

## 3. Captains

- A captain runs from **exactly one marina** (their home port). **Captains do not travel** to other marinas.
- A captain offers a set of charter types and a set of durations. These are independent: a captain who offers Fishing and Sandbar, and Half day and Full day, can run all four combinations.
- The admin sets each captain's marina, types and durations. Captains don't edit these themselves.
- A captain with no marina, no types or no durations receives no requests. The admin should be able to see these captains so they can be completed.

---

## 4. Matching

A captain **matches** a request when all of these are true:

1. The captain's marina is in the request's area, and that marina is active.
2. The captain offers the request's charter type.
3. The captain offers the request's duration.

Matching is based on areas and marinas only, never on straight-line distance.

---

## 5. Request lifecycle

### 5.1 Creating a request

- A customer can create a request for **any active listing**, whether or not a captain covers it.
- The customer chooses an area, not a marina. The marina is set when a captain claims the request: it's that captain's marina.
- The customer's experience is the same whether or not a captain covers the listing.

### 5.2 What happens next

- **If at least one captain matches:** the request is open, and every matching captain is notified so they can claim it.
- **If no captain matches:** the request is flagged as **needs captain**. The admin is alerted (area, type, duration, date, party size and a link to the request). No captain is notified. The system records when the request was flagged.

### 5.3 When coverage is added

When the admin adds anything that creates new coverage (a new captain, a captain's marina being set or changed, a type or duration added to a captain, a marina added to an area, or a marina switched back on):

- Any **needs captain** request with an upcoming trip that now has a matching captain becomes open automatically. The matching captains are notified, and the admin is told the request was released.
- A captain who newly matches existing open, unclaimed requests is notified about them, so a new captain immediately sees available work. Captains are not notified twice about the same request.

### 5.4 When coverage is removed

- If an open, unclaimed request no longer has any matching captain (because a captain was removed, a captain's marina changed, a marina was removed from the area or switched off, or a type or duration was removed), it goes back to **needs captain** and the admin is alerted.
- Requests that have already been claimed are not changed automatically. The admin handles those.

### 5.5 Claiming

- Only a matching captain can claim a request.
- The trip leaves from the claiming captain's marina. The captain doesn't choose a marina when claiming.
- Only one captain can claim a request. If two try at the same moment, exactly one succeeds, and the other is told it's no longer available.
- Once claimed, every participant is told the marina name, address and their own drive time (section 6).

---

## 6. Drive time for customers

- People in one split can come from different places, so drive time is calculated **per participant**.
- When joining a request, a customer is asked where they're staying (an address or place search).
- **Before a captain claims:** show a range based on all active marinas in the area, e.g. "About 25–50 min from you, depending on which marina the captain uses." If both ends are the same, show one number. If the area has no marinas yet, estimate from a central point in the area.
- **After a captain claims:** show the exact drive to the chosen marina, e.g. "Your charter leaves from {marina}, about 32 min from {where you're staying}." This is recalculated for every participant at the moment of the claim, and calculated directly for anyone who joins afterwards.
- Drive times must come from a real routing service (actual road routes), not straight-line distance. Geography in South Florida makes straight-line distance misleading.
- If a customer doesn't give a location, skip the estimate and just show the marina address once known.

---

## 7. Privacy and access

- A participant's location is visible only to that participant and the admin. Other participants and captains never see it.
- Coverage information (which listings have captains, the needs-captain queue) is visible only to the admin.
- Captains don't see needs-captain requests.
- Only the admin can manage areas, marinas, types, durations, listings, and captains' marinas, types and durations. Customers and captains can view what they need to use the site.

---

## 8. Admin capabilities

The admin can:

- Add and edit areas, marinas, charter types and durations, and switch any of them off.
- Link marinas to areas.
- Set each captain's marina, types and durations.
- Manage listings: set details such as price, and switch combinations off.
- **See coverage gaps:** each listing shows whether it has a matching captain (and how many). The admin can filter to uncovered listings only and group them by area, e.g. "Miami: no Fishing captain" or "Lower Keys: no Full-day Sandbar captain".
- **Work the needs-captain queue:** all flagged requests, soonest trip first, showing area, type, duration, party size, number of participants and how long each has been waiting.
- See at a glance how many listings are uncovered and how many requests are flagged.
- See captains who are missing a marina, types or durations.

---

## 9. Moving off the hard-coded values

- The three current areas become admin-managed areas with the same names.
- Current charter types and durations become admin-managed types and durations.
- Current marinas are added and linked to their areas.
- Existing ghost charters become listings, keeping their current prices and details.
- Existing captains are each given a marina, types and durations based on their current data. Anything that can't be worked out automatically is listed for the admin to fill in rather than guessed.
- Existing requests are linked to the matching listing. Unclaimed requests with no matching captain are flagged as needs captain.
- When finished, no hard-coded area, type or duration values remain in the code.

---

## 10. Acceptance criteria

- [ ] No hard-coded area, charter type or duration values remain in the code.
- [ ] Adding a new area in the admin (no code change) creates its listings, and customers can request them immediately.
- [ ] A customer can request any active listing, including one with no captain.
- [ ] A request with no matching captain is flagged as needs captain, appears in the admin queue and alerts the admin. No captain is notified.
- [ ] Uncovered listings are flagged in the admin; covered ones show a captain count.
- [ ] Adding coverage that matches a flagged request automatically opens it and notifies the matching captain(s).
- [ ] Removing the only matching captain from an open, unclaimed request flags it as needs captain again.
- [ ] A Key West–only captain is never notified of a request in another area.
- [ ] A captain is never notified of, and can't claim, a request for a type they don't offer, even in their own area.
- [ ] A captain is never notified of, and can't claim, a request for a duration they don't offer, even in their own area and for a type they offer.
- [ ] A listing whose area and type are covered, but whose duration no captain offers, is flagged as uncovered.
- [ ] When two captains claim the same request at the same moment, exactly one succeeds.
- [ ] A captain whose marina isn't in the request's area can't claim it.
- [ ] A claimed request's marina is the claiming captain's marina.
- [ ] Each participant sees their own drive estimate: a range before the claim, an exact time after.
- [ ] Participant locations are never visible to other participants or captains. Coverage information is never visible to customers or captains.

---

## 11. Open items for the owner

- How captain notifications and admin alerts are sent (reuse whatever the site uses today).
- Whether customers on a needs-captain request see "We're confirming a captain for this trip", or the request looks the same as any other open request.
- Whether the admin should be alerted when an open request goes unclaimed for a set number of hours, and whether to send a daily summary of flagged requests with trips in the next 7 days.
