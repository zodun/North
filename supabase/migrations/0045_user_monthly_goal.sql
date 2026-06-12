-- ─────────────────────────────────────────────────────────────────────
-- User-authored monthly goal (MONTH-02)
--
-- The monthly mission is still seeded from a focus-area template
-- (generated_by = 'template'), but each month we now prompt the user to
-- write their own goal. When they do, the `plan-month` Edge Function sets
-- generated_by = 'manual' and regenerates the weekly milestones + daily
-- steps from their words.
--
-- This migration only adds the bookkeeping the prompt needs:
--   • profiles.goal_prompt_dismissed_month — the month_start the user last
--     dismissed the "set your goal" prompt, so we don't nag them again that
--     month. Cleared implicitly each month because the value won't match the
--     new month_start.
--
-- The goal write itself is done by the Edge Function with the service role
-- (it also has to regenerate steps), so no client-facing RPC is needed here.
-- profiles already allows the owner to update their own row (see the cadence
-- toggle), so the client dismiss is a plain update.
-- ─────────────────────────────────────────────────────────────────────

alter table public.profiles
    add column if not exists goal_prompt_dismissed_month date;
