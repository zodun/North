-- ─────────────────────────────────────────────────────────────────────
-- M3 signal UI model: callout ratings (SIG-03) + user reflections (AI-06).
--
-- signal_scores, signal_summaries, and their RLS already exist from
-- 0003–0005. This migration adds the two interaction tables that the
-- Signal tab UI writes to.
--
--   1. callout_ratings — thumbs up/down on each AI callout (SIG-03).
--      Drives KPI-04 (signal classification accuracy) and eventual
--      prompt tuning. Keyed (user_id, week_ending, callout_idx) so
--      there is exactly one rating per callout per user per week;
--      a second tap replaces the first.
--
--   2. user_reflections — weekly free-text reflection entries (AI-06).
--      Inserted by the client; analyzed asynchronously by the `reflect`
--      Edge Function (service role writes analyzed_at + analysis).
--      One or more reflections per user per week are allowed — the UI
--      shows the most recent analysis.
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. callout_ratings ───────────────────────────────────────────────

create table public.callout_ratings (
    user_id      uuid      not null references auth.users(id) on delete cascade,
    week_ending  date      not null,
    callout_idx  smallint  not null check (callout_idx between 0 and 1),
    rating       text      not null check (rating in ('up', 'down')),
    rated_at     timestamptz not null default now(),
    primary key (user_id, week_ending, callout_idx)
);

create index callout_ratings_week_idx
    on public.callout_ratings (week_ending desc);

alter table public.callout_ratings enable row level security;

create policy callout_ratings_self on public.callout_ratings
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ── 2. user_reflections ──────────────────────────────────────────────

create table public.user_reflections (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    week_ending  date not null,
    body         text not null check (char_length(body) between 1 and 1000),
    created_at   timestamptz not null default now(),
    analyzed_at  timestamptz,
    analysis     jsonb
);

create index user_reflections_user_idx
    on public.user_reflections (user_id, week_ending desc, created_at desc);

alter table public.user_reflections enable row level security;

-- Client inserts and reads own rows; service role writes analysis columns.
create policy user_reflections_self_select on public.user_reflections
    for select using (auth.uid() = user_id);

create policy user_reflections_self_insert on public.user_reflections
    for insert with check (auth.uid() = user_id);
