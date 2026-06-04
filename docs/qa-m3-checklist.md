# M3-QA — Manual Checklist

**Milestone 3 acceptance:** the Signal tab shows a signal score, weekly analysis, time breakdown and Signal/Noise callouts; the Opportunities tab serves a searchable, filterable, manually-uploaded feed with save/apply and submit-intake; closed beta is live.

Run this after deploying migrations 0001–0024. Use a fresh test account that has completed onboarding and has at least one week of usage (interactions + mission completions) so the signal score and weekly summary jobs have data to work with.

---

## Path A — Signal tab (SIG-02 / AI-04 / AI-05 / SIG-03 / AI-06)

| # | Step | Expected | Pass |
|---|---|---|---|
| A1 | Open the Signal tab for a user with < 1 week of activity. | Empty state card: "Keep going. Your Signal score will appear here after your first full week of activity." No score shown. | |
| A2 | Open the Signal tab for a user with ≥ 1 week of activity (signal score computed). | Band name displayed in colour (accent for Aligned, inkMid for Finding, warn for Drifting). Trend arrow (↑/→/↓). Never the raw number. | |
| A3 | Inspect Supabase: `signal_scores` for the test user. | Row present for most recent `week_ending`; `band` in ('Aligned','Finding','Drifting'); `provisional = false` if ≥ 14 days active; `inputs` JSONB populated with A/C/K/V fields. | |
| A4 | Check "THIS WEEK" narrative card. | If weekly summary job has run: non-empty narrative text. If not yet run: italic placeholder "Your weekly summary arrives on Sunday after the analysis runs." | |
| A5 | Inspect Supabase: `signal_summaries`. | Row present for current `week_ending`; `summary_text` non-empty; `callouts` JSON array with 0–2 items, each with `label` + `body`. | |
| A6 | Verify Signal/Noise callout cards (AI-05). | 0–2 callout cards visible below narrative. Each shows a label + body + thumbs row. | |
| A7 | Tap "▲ Helpful" on a callout. | Thumbs row updates optimistically; Supabase `callout_ratings` row upserted with `rating = 'up'` for `(user_id, week_ending, callout_idx)`. | |
| A8 | Tap "▼ Not quite" on the same callout. | Rating flips to 'down'; other callout unaffected. | |
| A9 | HOW IT BROKE DOWN section. | Active days / tasks done / in-focus % shown; values match `signal_scores.inputs` for the current week. | |
| A10 | CARRY FORWARD — type a reflection and tap Reflect. | Spinner while submitting. On success: input clears; theme pills + nudge sentence appear in the card. Supabase: `user_reflections` row with `analysis` JSONB populated. | |
| A11 | Kill app and relaunch, return to Signal tab. | Previous reflection's nudge and themes still rendered from `lastReflection` loaded fresh. | |

---

## Path B — Opportunities tab (OPP-03 / OPP-04)

| # | Step | Expected | Pass |
|---|---|---|---|
| B1 | Open Opportunities tab. | Scrollable list of cleared + published opportunities. Only `license_status = 'cleared'` rows visible (draft rows absent). Empty state if no cleared rows yet. | |
| B2 | Tap a category pill (e.g. "Jobs"). | List filters to jobs only; "All" becomes unselected. Other categories deselected. | |
| B3 | Tap "All" pill. | Full list restored. | |
| B4 | Type in the search bar. | List narrows to items matching title, org, type, or location. Clears back to full list when input cleared. | |
| B5 | Tap "Save" on an opportunity card. | Button label changes to "Saved" with accent tint immediately (optimistic). Supabase: `user_saved_opportunities` row inserted for `(user_id, opportunity_id)` with `applied = false`. | |
| B6 | Tap "Saved" again (toggle off). | Reverts to "Save" with no tint. Supabase: row deleted. | |
| B7 | Tap "Apply ↗" on an opportunity with an `external_url`. | System browser / in-app browser opens to the external URL. Button label changes to "Applied ✓". Supabase: row upserted with `applied = true`, `applied_at` set. | |
| B8 | Reload the Opportunities tab. | Previously saved and applied states are restored from Supabase. | |
| B9 | Inspect Supabase: `user_saved_opportunities` as another test user. | Row is not visible (RLS — own rows only). | |

---

## Path C — Submit an opportunity (OPP-05)

| # | Step | Expected | Pass |
|---|---|---|---|
| C1 | Scroll to the bottom of the Opportunities tab. | Dashed "Submit an opportunity" button visible. | |
| C2 | Tap it. | Inline form expands with fields: Title, Organisation, Type, Location, Deadline, Description, Link. | |
| C3 | Attempt to tap Submit with required fields blank (Title, Org, Link). | Submit button disabled / does nothing. | |
| C4 | Fill in Title, Organisation, and Link only. Tap Submit. | Spinner appears; on success: form replaced with "Thanks for the tip." success state. Supabase: `opportunity_submissions` row with `status = 'pending'`, `submitted_by = user_id`. | |
| C5 | Tap Close. | Submit form collapses; "Submit an opportunity" button returns. | |
| C6 | Inspect Supabase: `opportunity_submissions` as a second test user. | Row from step C4 is not visible (RLS — submitter reads own rows only). | |
| C7 | Try to update `status = 'approved'` on the submission as the submitting user. | Blocked by RLS (admin-only UPDATE). | |

---

## Path D — Profile: signal band + saved opportunities (PRO-03)

| # | Step | Expected | Pass |
|---|---|---|---|
| D1 | Open Profile tab for a user with no signal score yet. | SIGNAL card: italic "Appears after your first full week of activity." No band name. | |
| D2 | Open Profile tab for a user with a computed signal score. | SIGNAL card: band name in correct colour (accent/inkMid/warn); trend arrow (↑ climbing / → holding / ↓ easing). Raw number never shown. | |
| D3 | Open Profile tab for a user with no saved opportunities. | SAVED card: italic "Save opportunities from the Opportunities tab." | |
| D4 | Save 1–3 opportunities from the Opportunities tab, then return to Profile. | SAVED card: count ("N opportunities saved") + up to 3 title · org lines. Count reflects actual `user_saved_opportunities` rows. | |
| D5 | Unsave all opportunities, return to Profile. | SAVED card reverts to empty-state nudge. | |

---

## Path E — Admin opportunities upload (OPP-01)

| # | Step | Expected | Pass |
|---|---|---|---|
| E1 | Sign in to the admin web app as an admin user; open `/admin/opportunities`. | Page lists existing opportunities with Status, Published columns. "Add opportunity" button visible. | |
| E2 | Tap "Add opportunity"; fill in Title, Org, Category, External URL, Attribution. Submit. | Form collapses; new row appears in table with `license_status = draft`. | |
| E3 | Inspect Supabase: `opportunities` table. | New row present with `license_status = 'draft'`, `published_at = null`. | |
| E4 | In the table row, tap "Clear" (enabled because URL + attribution are set). | Row status flips to "Live"; `license_status = 'cleared'`, `published_at` set to now(). | |
| E5 | Open Opportunities tab in the native app. | Newly cleared opportunity appears in the feed. | |
| E6 | Sign in with a non-admin user and navigate to `/admin/opportunities`. | Access denied or page returns no admin actions (RLS blocks writes). | |

---

## Automated database-layer checks

Run the full SQL test suite after `supabase db reset`:

```bash
DB_URL=$(supabase status --output env | grep DB_URL | cut -d'=' -f2- | tr -d '"')
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/m1_e2e.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/m2_e2e.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/m3_e2e.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_cross_user.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/signal_score_archetypes.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/streak_archetypes.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/alignment_instrument.sql
```

All seven must pass with no exceptions before M3 is considered closed.
