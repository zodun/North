# M1-QA — Manual Checklist

**Milestone 1 acceptance:** a new user can complete the 7-question onboarding and scroll a curated For You feed (like/save/share, topic follow) in the live app, with behavioural events captured.

Run this after deploying migrations 0001–0017 and the 60-item content seed. Use a fresh test account each time (or run `supabase db reset` for local).

---

## Path A — Sign-up → Onboarding → Feed

| # | Step | Expected | Pass |
|---|---|---|---|
| A1 | Launch the app cold (not signed in). | Welcome / sign-in screen visible. | |
| A2 | Create a new account (email). | No error; proceeds to onboarding. |  |
| A3 | Kill and relaunch mid-onboarding (after Q3). | App resumes at Q4, not Q1 (ONB-03 resume logic). | |
| A4 | Complete Q1–Q5 in order. | Progress bar advances; Back works on each screen. | |
| A5 | Q6 — baseline pulse. | 5-option scale renders; selection persists on back/forward. | |
| A6 | Q7 — consent screen. | 4 consent bullets visible; DPA disclosure paragraph visible in muted small text below bullets. | |
| A7 | Tap "I agree — take me in". | Spinner shown; navigates to For You tab on success. No error. | |
| A8 | Check Supabase: `profiles` row. | `onboarded_at` and `consent_given_at` both set (not null). | |
| A9 | Check Supabase: `missions` + `user_mission_tasks`. | 1 mission for today, 3 tasks. | |
| A10 | Check Supabase: `weekly_pulses`. | 1 row for the current ISO week with correct score. | |
| A11 | Kill and relaunch after completion. | Lands on For You tab directly (not onboarding). | |

---

## Path B — For You feed

| # | Step | Expected | Pass |
|---|---|---|---|
| B1 | For You tab loaded. | Cards visible; no empty state; category filter bar at top. | |
| B2 | Scroll through 3 cards. | Snap-to-card at full screen height; no jank (≥ 50fps). | |
| B3 | Tap the category filter (e.g. "Entrepreneurship"). | Feed filters to that category only. Tap again (same) or "All" to clear. | |
| B4 | Dwell on a card for 4 seconds. | No crash. (Check Supabase: 1 `view` row for that item.) | |
| B5 | Dwell on a card for 32 seconds. | Check Supabase: 1 `long_dwell` row with `dwell_ms ≥ 30000`. | |
| B6 | Swipe quickly past a card (< 3 s). | Check Supabase: 1 `pass` row with `dwell_ms < 3000`. | |
| B7 | Tap the heart (Resonates) button. | Icon fills with accent colour immediately (optimistic). Check Supabase: `matters` row present. | |
| B8 | Tap the bookmark (Save) button. | Icon fills immediately. Check Supabase: `save` row present. | |
| B9 | Tap the Share button. | OS share sheet opens; `share` row written to Supabase after sheet dismissed. | |
| B10 | Tap "Read" / "View" CTA on a card. | External URL opens in the device browser. | |
| B11 | Kill and relaunch; return to For You. | Previously saved / resonated cards show filled icons (state hydrated from `content_interactions`). | |

---

## Path C — Interaction capture verification (SIGCAP)

Spot-check in Supabase dashboard (Table Editor → `content_interactions`) or PostHog after completing Paths A and B.

| # | Check | Expected |
|---|---|---|
| C1 | Rows visible in `content_interactions`. | All view, dwell, pass, save, matters, share events present. |
| C2 | `content_category_id` column. | Non-null for items that have a category; matches the item's category. |
| C3 | `kind` column. | Matches the item's kind (`essay`, `voice`, etc.). |
| C4 | `user_id` column. | Matches the signed-in user's UUID — no cross-user leakage. |
| C5 | PostHog dashboard. | `content_interaction` events appear with matching properties. |

---

## Path D — Performance (M1-PERF)

| # | Check | Expected |
|---|---|---|
| D1 | Scroll 10 cards on a mid-range Android (or Android emulator, API 34). | No dropped frames; transitions feel instant. |
| D2 | Cold start to first card visible. | < 2 seconds on a standard connection (content is text-only for M1). |
| D3 | Flip between category filters rapidly. | No blank screens; filter applies within 1 frame (client-side). |

---

## Automated database-layer checks

Run the SQL test suite after `supabase db reset`:

```bash
DB_URL=$(supabase status --output env | grep DB_URL | cut -d'=' -f2- | tr -d '"')
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/m1_e2e.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_cross_user.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/signal_score_archetypes.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/streak_archetypes.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/alignment_instrument.sql
```

All five must pass with no exceptions before M1 is considered closed.
