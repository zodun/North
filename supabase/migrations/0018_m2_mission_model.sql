-- ─────────────────────────────────────────────────────────────────────
-- DM-M2-01: M2 data model — mission provenance + RLS tightening.
--
-- Three changes:
--
-- 1. AI generation provenance on `missions`.
--    AI-01 (Edge Function) generates missions; AI-03 requires cost tracking.
--    Four columns capture how a mission was made and what it cost so the
--    signal score and analytics can distinguish AI vs. template vs. manual.
--
-- 2. Index on user_mission_tasks(mission_id).
--    The streak engine (0007) and the "today's tasks" query both join
--    missions → user_mission_tasks. Without this index every task lookup
--    is a full table scan against user_mission_tasks.
--
-- 3. RLS tightening.
--    In M2, missions and tasks are created by server-side jobs (service role)
--    or the complete_onboarding RPC (security definer). The client only needs
--    to read missions and update task completion state. Tightening both
--    policies from 'for all' to explicit operations enforces least-privilege
--    and closes the window where a client could insert rogue missions or
--    delete tasks they shouldn't touch.
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. AI generation provenance ──────────────────────────────────────

alter table public.missions
    add column generated_by text not null default 'template'
        check (generated_by in ('ai', 'template', 'manual')),
    add column model_name text,
    add column prompt_version text,
    add column generation_tokens int;

-- ── 2. Index for mission → tasks join ────────────────────────────────

create index user_mission_tasks_mission_id_idx
    on public.user_mission_tasks (mission_id);

-- ── 3. RLS: missions — read-only for clients ─────────────────────────
-- Server (service role / security-definer RPCs) bypasses RLS and can
-- INSERT/UPDATE. Clients may only SELECT their own rows.

drop policy missions_self on public.missions;

create policy missions_self_select
    on public.missions for select
    using (auth.uid() = user_id);

-- ── 3. RLS: user_mission_tasks — select + update only ────────────────
-- Tasks are created by the daily mission job and complete_onboarding
-- (both run as service role or security definer). Clients update `done`,
-- `completed_at`, and `abandon_count` but never insert or delete tasks.

drop policy user_mission_tasks_self on public.user_mission_tasks;

create policy user_mission_tasks_self_select
    on public.user_mission_tasks for select
    using (auth.uid() = user_id);

create policy user_mission_tasks_self_update
    on public.user_mission_tasks for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
