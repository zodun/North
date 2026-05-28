-- North · domain schema baseline
-- Supabase manages the auth.* schema. This migration sets up the
-- product-side tables only. Field shapes follow the FR-* requirements
-- in docs/north-operating-document.md (Section 6, Section 8). M1 fields
-- are required; later-milestone fields are nullable stubs to keep this
-- migration lean.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────
-- Admin allow-list (used by RLS policies on curated tables and by the
-- web admin app's middleware). Membership is managed by hand for MVP.
-- ─────────────────────────────────────────────────────────────────────
create table public.admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    granted_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- Per-user profile. One row per auth.users row; created on first sign-in
-- by a trigger so RLS policies never have to handle missing rows.
-- ─────────────────────────────────────────────────────────────────────
create table public.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    statement_of_intent text,
    time_budget_label text,
    season_label text,
    avoid_note text,
    consent_given_at timestamptz,
    onboarded_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (user_id) values (new.id)
    on conflict (user_id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- Focus areas (curated taxonomy; FOCUS_AREAS in the prototype).
-- ─────────────────────────────────────────────────────────────────────
create table public.focus_areas (
    id text primary key,
    label text not null,
    hue text not null,
    sort_order int not null default 0
);

create table public.user_focus_areas (
    user_id uuid not null references auth.users(id) on delete cascade,
    focus_area_id text not null references public.focus_areas(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, focus_area_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- Curated content (FR-FEED-04; 50–100 hand-picked items for v1).
-- ─────────────────────────────────────────────────────────────────────
create table public.content_items (
    id uuid primary key default gen_random_uuid(),
    kind text not null check (kind in ('essay','voice','story','opportunity')),
    focus_area_id text references public.focus_areas(id) on delete set null,
    eyebrow text,
    title text not null,
    body text,
    source text,
    external_url text,
    published_at timestamptz,
    created_at timestamptz not null default now()
);

create index content_items_published_idx
    on public.content_items (published_at desc) where published_at is not null;

-- Behavioural events per user × content item (drives C in the signal score).
create table public.content_interactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    content_item_id uuid not null references public.content_items(id) on delete cascade,
    action text not null check (action in ('view','save','matters','pass','finish','share','long_dwell')),
    dwell_ms int,
    created_at timestamptz not null default now()
);

create index content_interactions_user_idx on public.content_interactions (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- Missions (generated daily; M2 surface).
-- ─────────────────────────────────────────────────────────────────────
create table public.missions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    mission_date date not null,
    title text,
    intent text,
    created_at timestamptz not null default now(),
    unique (user_id, mission_date)
);

create table public.user_mission_tasks (
    id uuid primary key default gen_random_uuid(),
    mission_id uuid not null references public.missions(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    label text not null,
    kind text,
    estimate_label text,
    done boolean not null default false,
    completed_at timestamptz,
    created_at timestamptz not null default now()
);

create index user_mission_tasks_user_idx on public.user_mission_tasks (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- Streaks + signal score (per-user, per-day rollups).
-- ─────────────────────────────────────────────────────────────────────
create table public.streaks (
    user_id uuid not null references auth.users(id) on delete cascade,
    day date not null,
    state smallint not null check (state between 0 and 3),  -- 0 miss · 1 active · 2 directed · 3 rest
    primary key (user_id, day)
);

create table public.signal_scores (
    user_id uuid not null references auth.users(id) on delete cascade,
    week_ending date not null,
    band text not null check (band in ('Drifting','Finding','Aligned')),
    raw_score int not null check (raw_score between 0 and 100),
    provisional boolean not null default false,
    computed_at timestamptz not null default now(),
    primary key (user_id, week_ending)
);

-- ─────────────────────────────────────────────────────────────────────
-- Alignment instrument (DEC-04 of the metrics spec).
-- ─────────────────────────────────────────────────────────────────────
create table public.weekly_pulses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    week_ending date not null,
    score smallint not null check (score between 0 and 4),
    created_at timestamptz not null default now(),
    unique (user_id, week_ending)
);

create table public.baseline_endpoint_responses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    measurement text not null check (measurement in ('baseline','day28')),
    items jsonb not null,
    composite numeric,
    captured_at timestamptz not null default now(),
    unique (user_id, measurement)
);

-- ─────────────────────────────────────────────────────────────────────
-- Opportunities (DEC-03 manual upload before scraping; FR-OPP-*).
-- ─────────────────────────────────────────────────────────────────────
create table public.opportunities (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    org text not null,
    opportunity_type text,
    location text,
    deadline text,
    why text,
    tags text[] not null default '{}',
    external_url text,
    published_at timestamptz,
    created_at timestamptz not null default now()
);

create index opportunities_published_idx
    on public.opportunities (published_at desc) where published_at is not null;
