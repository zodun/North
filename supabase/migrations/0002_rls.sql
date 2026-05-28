-- North · RLS policies
-- Honours Section 6.2 of the operating document:
--   "all data access shall be enforced by Supabase Row-Level Security;
--    users shall only ever read/write their own behavioural and profile data."
--
-- Pattern: enable RLS on every table (default-deny), then add the minimum
-- per-table policies. Curated tables (focus_areas, content_items,
-- opportunities) are publicly readable; only admins (membership in the
-- public.admins table) may write them. Behavioural tables are scoped
-- to auth.uid() = user_id on both read and write.

-- ─────────────────────────────────────────────────────────────────────
-- Helper: is the caller in the admin allow-list? Used by curated-table
-- write policies. SECURITY DEFINER so it can read public.admins under RLS
-- without the caller needing read permission on the table.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Enable RLS on every table (default-deny).
-- ─────────────────────────────────────────────────────────────────────
alter table public.admins enable row level security;
alter table public.profiles enable row level security;
alter table public.focus_areas enable row level security;
alter table public.user_focus_areas enable row level security;
alter table public.content_items enable row level security;
alter table public.content_interactions enable row level security;
alter table public.missions enable row level security;
alter table public.user_mission_tasks enable row level security;
alter table public.streaks enable row level security;
alter table public.signal_scores enable row level security;
alter table public.weekly_pulses enable row level security;
alter table public.baseline_endpoint_responses enable row level security;
alter table public.opportunities enable row level security;

-- ─────────────────────────────────────────────────────────────────────
-- admins · self-read only; writes go through the service role.
-- ─────────────────────────────────────────────────────────────────────
create policy admins_read_self on public.admins
    for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- profiles · own row, read + write.
-- ─────────────────────────────────────────────────────────────────────
create policy profiles_read_own on public.profiles
    for select using (auth.uid() = user_id);

create policy profiles_update_own on public.profiles
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- focus_areas · public read; admin write.
-- ─────────────────────────────────────────────────────────────────────
create policy focus_areas_read_all on public.focus_areas
    for select using (true);

create policy focus_areas_admin_write on public.focus_areas
    for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- user_focus_areas · own rows only.
-- ─────────────────────────────────────────────────────────────────────
create policy user_focus_areas_self on public.user_focus_areas
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- content_items · published rows publicly readable; admin write.
-- ─────────────────────────────────────────────────────────────────────
create policy content_items_read_published on public.content_items
    for select using (published_at is not null and published_at <= now());

create policy content_items_admin_write on public.content_items
    for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- content_interactions · own rows only (behavioural data).
-- ─────────────────────────────────────────────────────────────────────
create policy content_interactions_self on public.content_interactions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- missions · own rows only. Server-side job creates rows under
-- the service role, which bypasses RLS by design.
-- ─────────────────────────────────────────────────────────────────────
create policy missions_self on public.missions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy user_mission_tasks_self on public.user_mission_tasks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- streaks · own rows only.
-- ─────────────────────────────────────────────────────────────────────
create policy streaks_self on public.streaks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- signal_scores · own rows; read-only via the client (scores are
-- computed server-side by scheduled jobs under the service role).
-- ─────────────────────────────────────────────────────────────────────
create policy signal_scores_read_self on public.signal_scores
    for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- weekly_pulses · own rows; read + write.
-- ─────────────────────────────────────────────────────────────────────
create policy weekly_pulses_self on public.weekly_pulses
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- baseline_endpoint_responses · own rows; read + write.
-- ─────────────────────────────────────────────────────────────────────
create policy baseline_endpoint_responses_self on public.baseline_endpoint_responses
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- opportunities · published rows publicly readable; admin write.
-- ─────────────────────────────────────────────────────────────────────
create policy opportunities_read_published on public.opportunities
    for select using (published_at is not null and published_at <= now());

create policy opportunities_admin_write on public.opportunities
    for all using (public.is_admin()) with check (public.is_admin());
