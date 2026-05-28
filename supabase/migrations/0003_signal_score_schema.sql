-- North · signal score · schema extensions (DEC-07; tracker DEC-03)
-- See docs/north-core-metrics-spec.md (DEC-03 section) for the design.

-- ─────────────────────────────────────────────────────────────────────
-- Extensions: scheduled jobs (pg_cron) + HTTP from Postgres (pg_net).
-- Both are pre-installed on Supabase hosted. On local dev, `supabase
-- start` ships pg_cron and pg_net out of the box. Migrations are
-- idempotent so `supabase db reset` is safe to re-run.
-- ─────────────────────────────────────────────────────────────────────
create extension if not exists pg_cron with schema cron;
create extension if not exists pg_net with schema extensions;

-- ─────────────────────────────────────────────────────────────────────
-- V (Avoidance) mechanism. The spec defines V as "count of distinct
-- aligned tasks skipped or abandoned ≥ 2× in the window, ÷ 3, capped at 1."
-- The base schema has no way to count repeated abandonment; this column
-- is bumped from the client whenever the user explicitly dismisses an
-- aligned task. V counts tasks with abandon_count ≥ 2 in the window.
-- ─────────────────────────────────────────────────────────────────────
alter table public.user_mission_tasks
    add column if not exists abandon_count int not null default 0;

create index if not exists user_mission_tasks_abandon_idx
    on public.user_mission_tasks (user_id, abandon_count)
    where abandon_count >= 2;

-- ─────────────────────────────────────────────────────────────────────
-- Persist the A/C/K/V breakdown alongside the band so the Edge Function
-- (and analytics) can read inputs without recomputing.
-- ─────────────────────────────────────────────────────────────────────
alter table public.signal_scores
    add column if not exists inputs jsonb not null default '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────────────
-- AI summary / callout storage (AI-04/05). One row per user per week.
-- Writes happen under the service role from the signal-summary Edge
-- Function; clients only read. RLS policies land in 0004_signal_score_rls.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.signal_summaries (
    user_id        uuid        not null references auth.users(id) on delete cascade,
    week_ending    date        not null,
    summary_text   text        not null,
    callouts       jsonb       not null default '[]'::jsonb,
    model_name     text        not null,
    prompt_version text        not null,
    generated_at   timestamptz not null default now(),
    primary key (user_id, week_ending)
);

create index if not exists signal_summaries_week_idx
    on public.signal_summaries (week_ending desc);
