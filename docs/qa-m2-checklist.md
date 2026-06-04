# M2-QA — Manual Checklist

**Milestone 2 acceptance:** an onboarded user receives a daily mission of three tasks, completes tasks with a working streak and progress bar, and sees their Profile reflect streaks and completed missions.

Run this after deploying migrations 0001–0021. Use a fresh test account each time (or run `supabase db reset` for the database layer). An account that already completed M1 onboarding works for Paths B–D.

---

## Path A — Daily mission assignment

| # | Step | Expected | Pass |
|---|---|---|---|
| A1 | Open the Mission tab for a freshly onboarded user. | Today's mission card visible: title, intent line, 3 tasks with estimate labels, progress bar showing 0 of 3. | |
| A2 | Inspect Supabase: `missions` table. | 1 row for today (`mission_date = today`); `generated_by = 'ai'` or `'template'`; `model_name` + `generation_tokens` set when AI was used. | |
| A3 | Open Mission tab before 08:00 UTC (04:00 AST) on a new day. | Mission from the previous day is still shown (date matches yesterday's `mission_date`). | |
| A4 | Open Mission tab at or after 08:00 UTC. | New day's mission appears (cron ran; `mission_date = today`). | |
| A5 | Trigger a mission generation failure (e.g. revoke OpenAI key temporarily). | Fallback template mission is shown; no crash; `generated_by = 'template'` in Supabase. | |

---

## Path B — Task completion (including offline)

| # | Step | Expected | Pass |
|---|---|---|---|
| B1 | Tap the circle on Task 1. | Circle fills with accent colour immediately (optimistic). Progress bar advances to 1/3. | |
| B2 | Check Supabase: `user_mission_tasks`. | Task 1 row: `done = true`, `completed_at` set. | |
| B3 | Tap Task 1 again (toggle off). | Circle reverts; progress bar back to 0/3. Supabase: `done = false`. | |
| B4 | Enable flight mode, then tap all 3 tasks. | All 3 check off immediately (optimistic UI). Progress bar reaches 3/3. | |
| B5 | Restore network within 30 seconds. | No visible change to UI. Supabase: all 3 tasks `done = true` (sync applied with retry backoff). | |
| B6 | Enable flight mode, tap Task 1, then kill and relaunch the app before reconnecting. | After network restores, Supabase eventually shows Task 1 `done = true`. (Server is source of truth; retry loop re-fires on launch.) | |
| B7 | Attempt to complete all 3 tasks while offline and stay offline for > 1.6 s (after 3× retry exhausted). | Optimistic state reverted on-screen; task circles unfilled. No crash. | |

---

## Path C — Streak engine + Profile

| # | Step | Expected | Pass |
|---|---|---|---|
| C1 | After completing all 3 tasks today, open Profile tab. | `RhythmStreakCard`: today's day slot is filled (accent). Consistency grid: today's cell shows `directed` state colour. | |
| C2 | Check Supabase: `streaks` table for today. | `state = 2` (directed). | |
| C3 | Complete only 1 task for a separate test user. | Supabase: `state = 1` (active) for that user's today row. | |
| C4 | Miss a day (no completions). | Supabase: the missed day's `state` flips to `3` (rest) if fewer than 2 rests have been used in the rolling 7; otherwise stays `0` (miss). | |
| C5 | Profile → missions-this-week card. | Shows correct completed/total task count and current rhythm streak number. | |
| C6 | Profile → ConsistencyGrid. | 28-cell grid; cells colour-coded by state (miss/active/directed/rest); no zero-shame counter visible. | |
| C7 | Kill app and relaunch. | Profile streak and grid values unchanged — persisted from Supabase `streaks` table. | |

---

## Path D — Notifications

| # | Step | Expected | Pass |
|---|---|---|---|
| D1 | Register a push token (grant permission on launch). | Token appears in `push_tokens` table for the user. | |
| D2 | Wait for the morning cron (13:00 UTC / 09:00 AST) or trigger `send-notifications` manually with `user_id`. | iOS/Android receives: "Your three tasks for today are ready." No loss-framing copy. | |
| D3 | Complete 0 tasks and wait for the evening cron (00:00 UTC / 20:00 AST). | Receives the gentle nudge: "Your mission is here when you're ready." | |
| D4 | Complete at least 1 task before the evening cron fires. | No evening nudge sent (function skips users with ≥ 1 completed task). | |
| D5 | Use an invalidated push token (simulate UNREGISTERED response from FCM/APNs). | Token deleted from `push_tokens`; no crash; other users' notifications unaffected. | |

---

## Automated database-layer checks

Run the full SQL test suite after `supabase db reset`:

```bash
DB_URL=$(supabase status --output env | grep DB_URL | cut -d'=' -f2- | tr -d '"')
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/m1_e2e.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/m2_e2e.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_cross_user.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/signal_score_archetypes.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/streak_archetypes.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/alignment_instrument.sql
```

All six must pass with no exceptions before M2 is considered closed.
