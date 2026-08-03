-- Mission rituals: habits, daily check-ins, completion reflections, and
-- an optional Eisenhower priority on mission tasks.
--
-- All four surfaces are strictly per-user: rows are readable and writable
-- only by their owner, matching the missions / user_mission_tasks model.
-- Check-ins and reflections are one-per-mission (missions are already
-- one-per-day), enforced with unique keys so the client can upsert.

-- ── Habits ───────────────────────────────────────────────────────────────
-- Small recurring rituals ("Morning pages", "No phone first hour") that sit
-- alongside the daily mission. Soft-delete via archived_at so history in
-- habit_checks survives.

create table public.habits (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    name        text        not null check (char_length(btrim(name)) between 1 and 80),
    created_at  timestamptz not null default now(),
    archived_at timestamptz
);

alter table public.habits enable row level security;

create policy habits_select on public.habits
    for select using (auth.uid() = user_id);

create policy habits_insert on public.habits
    for insert with check (auth.uid() = user_id);

create policy habits_update on public.habits
    for update using (auth.uid() = user_id);

create policy habits_delete on public.habits
    for delete using (auth.uid() = user_id);

create index habits_user_idx on public.habits (user_id, created_at);

-- One check per habit per day. Delete = untick (the toggle).

create table public.habit_checks (
    habit_id    uuid        not null references public.habits(id) on delete cascade,
    user_id     uuid        not null references auth.users(id) on delete cascade,
    day         date        not null,
    created_at  timestamptz not null default now(),
    primary key (habit_id, day)
);

alter table public.habit_checks enable row level security;

create policy habit_checks_select on public.habit_checks
    for select using (auth.uid() = user_id);

create policy habit_checks_insert on public.habit_checks
    for insert with check (auth.uid() = user_id);

create policy habit_checks_delete on public.habit_checks
    for delete using (auth.uid() = user_id);

create index habit_checks_user_day_idx on public.habit_checks (user_id, day);

-- ── Mission check-ins ────────────────────────────────────────────────────
-- One evening check-in per mission: a quick reply (done / partly / stuck),
-- an optional note, and the short coaching response the client obtained
-- (AI best-effort, static fallback otherwise).

create table public.mission_check_ins (
    id             uuid        primary key default gen_random_uuid(),
    user_id        uuid        not null references auth.users(id) on delete cascade,
    mission_id     uuid        not null references public.missions(id) on delete cascade,
    reply          text        not null check (reply in ('done','partly','stuck')),
    note           text        check (note is null or char_length(note) <= 1000),
    coach_response text,
    created_at     timestamptz not null default now(),
    unique (user_id, mission_id)
);

alter table public.mission_check_ins enable row level security;

create policy mission_check_ins_select on public.mission_check_ins
    for select using (auth.uid() = user_id);

create policy mission_check_ins_insert on public.mission_check_ins
    for insert with check (auth.uid() = user_id);

-- Upsert path: re-answering the same mission's check-in updates in place.
create policy mission_check_ins_update on public.mission_check_ins
    for update using (auth.uid() = user_id);

-- ── Mission reflections ──────────────────────────────────────────────────
-- One line captured at mission completion; surfaced again in the Journal.

create table public.mission_reflections (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    mission_id  uuid        not null references public.missions(id) on delete cascade,
    body        text        not null check (char_length(btrim(body)) between 1 and 500),
    created_at  timestamptz not null default now(),
    unique (user_id, mission_id)
);

alter table public.mission_reflections enable row level security;

create policy mission_reflections_select on public.mission_reflections
    for select using (auth.uid() = user_id);

create policy mission_reflections_insert on public.mission_reflections
    for insert with check (auth.uid() = user_id);

create policy mission_reflections_update on public.mission_reflections
    for update using (auth.uid() = user_id);

-- ── Task priority ────────────────────────────────────────────────────────
-- Optional Eisenhower quadrant on a task. Null = default mapping in the
-- client (today's next step reads as urgent+important).
--   ui = urgent+important · ni = important, not urgent
--   un = urgent, not important · nn = neither

alter table public.user_mission_tasks
    add column priority text check (priority in ('ui','ni','un','nn'));
