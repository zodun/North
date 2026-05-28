-- North · streak rules · archetype tests (operating-doc DEC-08; tracker DEC-05)
--
-- Run against a fresh local Supabase:
--   supabase db reset
--   psql "$(supabase status --output env | grep DB_URL | cut -d'=' -f2- | tr -d '"')" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/streak_archetypes.sql
--
-- Asserts: ast_day grace cutoff, rhythm-hero, rest-holds-on-miss,
-- hard-break after rest exhaustion, and grace-cutoff during a task write.

begin;

-- ─────────────────────────────────────────────────────────────────────
-- 1. ast_day · two timestamps either side of the AST 04:00 cutoff.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    before_cutoff date := public.ast_day('2026-05-28T07:59:00Z'::timestamptz); -- AST 03:59
    after_cutoff  date := public.ast_day('2026-05-28T08:00:00Z'::timestamptz); -- AST 04:00
begin
    if before_cutoff <> '2026-05-27' then
        raise exception 'ast_day grace cutoff: expected 2026-05-27 for 07:59Z, got %', before_cutoff;
    end if;
    if after_cutoff <> '2026-05-28' then
        raise exception 'ast_day grace cutoff: expected 2026-05-28 for 08:00Z, got %', after_cutoff;
    end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- Seed users for the behavioural archetypes.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_hero   constant uuid := '00000000-0000-0000-0000-000000000101';
    u_rests  constant uuid := '00000000-0000-0000-0000-000000000102';
    u_break  constant uuid := '00000000-0000-0000-0000-000000000103';
    u_grace  constant uuid := '00000000-0000-0000-0000-000000000104';
    target   constant date := '2026-05-28';
    onboarded constant timestamptz := (target - 30)::timestamptz;
begin
    insert into auth.users (id, email, instance_id, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
        (u_hero,  'hero@streak.test',  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded),
        (u_rests, 'rests@streak.test', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded),
        (u_break, 'break@streak.test', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded),
        (u_grace, 'grace@streak.test', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded)
    on conflict (id) do nothing;
    update public.profiles set onboarded_at = onboarded where user_id in (u_hero, u_rests, u_break, u_grace);
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Rhythm-hero · 7 directed days. Insert one mission per day with
--    3/3 tasks done. Trigger recomputes streaks. Expect rhythm = 7.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_hero constant uuid := '00000000-0000-0000-0000-000000000101';
    target constant date := '2026-05-28';
    rhythm int;
    mid    uuid;
    d      int;
begin
    for d in 0..6 loop
        mid := gen_random_uuid();
        insert into public.missions (id, user_id, mission_date, title)
        values (mid, u_hero, target - d, 'hero mission ' || d);
        insert into public.user_mission_tasks (mission_id, user_id, label, done, created_at, completed_at)
        values
            (mid, u_hero, 't1', true, (target - d)::timestamptz + interval '14h', (target - d)::timestamptz + interval '14h'),
            (mid, u_hero, 't2', true, (target - d)::timestamptz + interval '15h', (target - d)::timestamptz + interval '15h'),
            (mid, u_hero, 't3', true, (target - d)::timestamptz + interval '16h', (target - d)::timestamptz + interval '16h');
    end loop;

    rhythm := public.compute_rhythm_streak(u_hero, target);
    if rhythm <> 7 then
        raise exception 'rhythm-hero: expected 7, got %', rhythm;
    end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Rest-holds-on-miss · 6 directed days + 1 miss in the middle.
--    Expect Wed (mid-week) to be auto-flipped to rest; rhythm = 7.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_rests constant uuid := '00000000-0000-0000-0000-000000000102';
    target  constant date := '2026-05-28';
    rhythm  int;
    miss_day_state smallint;
    miss_day constant date := '2026-05-25';   -- mid-window
    mid uuid;
    d int;
begin
    for d in 0..6 loop
        if (target - d) = miss_day then
            -- create the mission row but no completed tasks
            insert into public.missions (id, user_id, mission_date, title)
            values (gen_random_uuid(), u_rests, miss_day, 'missed');
        else
            mid := gen_random_uuid();
            insert into public.missions (id, user_id, mission_date, title)
            values (mid, u_rests, target - d, 'done');
            insert into public.user_mission_tasks (mission_id, user_id, label, done, created_at, completed_at)
            values
                (mid, u_rests, 't1', true, (target - d)::timestamptz + interval '14h', (target - d)::timestamptz + interval '14h'),
                (mid, u_rests, 't2', true, (target - d)::timestamptz + interval '15h', (target - d)::timestamptz + interval '15h'),
                (mid, u_rests, 't3', true, (target - d)::timestamptz + interval '16h', (target - d)::timestamptz + interval '16h');
        end if;
    end loop;

    -- Force a recompute of the window now that all writes have landed.
    perform public.recompute_streak_window(u_rests, target);

    select state into miss_day_state from public.streaks
    where user_id = u_rests and day = miss_day;
    if miss_day_state <> 3 then
        raise exception 'rest-holds: expected miss day to flip to rest (state=3), got %', miss_day_state;
    end if;

    rhythm := public.compute_rhythm_streak(u_rests, target);
    if rhythm <> 7 then
        raise exception 'rest-holds: expected rhythm=7, got %', rhythm;
    end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. Hard-break · 4 directed days + 3 consecutive misses. Only 2
--    rests should auto-consume; the third miss stays state=0, and
--    rhythm computed from the current day backwards stops at the
--    miss closest to today.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_break constant uuid := '00000000-0000-0000-0000-000000000103';
    target  constant date := '2026-05-28';
    rhythm  int;
    rest_count int;
    mid uuid;
    d int;
begin
    -- Days 0,1,2 (today, yesterday, day before) = misses. Days 3..6 = directed.
    for d in 0..6 loop
        if d in (0, 1, 2) then
            insert into public.missions (id, user_id, mission_date, title)
            values (gen_random_uuid(), u_break, target - d, 'miss');
        else
            mid := gen_random_uuid();
            insert into public.missions (id, user_id, mission_date, title)
            values (mid, u_break, target - d, 'done');
            insert into public.user_mission_tasks (mission_id, user_id, label, done, created_at, completed_at)
            values
                (mid, u_break, 't1', true, (target - d)::timestamptz + interval '14h', (target - d)::timestamptz + interval '14h'),
                (mid, u_break, 't2', true, (target - d)::timestamptz + interval '15h', (target - d)::timestamptz + interval '15h'),
                (mid, u_break, 't3', true, (target - d)::timestamptz + interval '16h', (target - d)::timestamptz + interval '16h');
        end if;
    end loop;
    perform public.recompute_streak_window(u_break, target);

    select count(*) into rest_count
    from public.streaks
    where user_id = u_break
      and day between target - 6 and target
      and state = 3;
    if rest_count <> 2 then
        raise exception 'hard-break: expected exactly 2 rest credits used, got %', rest_count;
    end if;

    rhythm := public.compute_rhythm_streak(u_break, target);
    -- Today (state=0 after rests exhausted) breaks the streak immediately → rhythm = 0.
    if rhythm <> 0 then
        raise exception 'hard-break: expected rhythm=0 (today missed), got %', rhythm;
    end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 5. Grace cutoff end-to-end · a task completed at 2026-05-28T07:00Z
--    (= AST 03:00) must count toward 2026-05-27's streak row, not
--    2026-05-28's. Tests that the trigger uses ast_day correctly.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_grace constant uuid := '00000000-0000-0000-0000-000000000104';
    yesterday constant date := '2026-05-27';
    today constant date := '2026-05-28';
    mid uuid;
    state_yesterday smallint;
    state_today     smallint;
begin
    mid := gen_random_uuid();
    insert into public.missions (id, user_id, mission_date, title)
    values (mid, u_grace, yesterday, 'late-night');
    -- Single completed task at AST 03:00 the next morning.
    insert into public.user_mission_tasks (mission_id, user_id, label, done, created_at, completed_at)
    values (mid, u_grace, 'late', true, '2026-05-28T07:00:00Z'::timestamptz, '2026-05-28T07:00:00Z'::timestamptz);

    -- Trigger should have populated the prior day's row as 'active'.
    select state into state_yesterday from public.streaks where user_id = u_grace and day = yesterday;
    select state into state_today     from public.streaks where user_id = u_grace and day = today;

    if state_yesterday is null or state_yesterday <> 1 then
        raise exception 'grace cutoff: yesterday should be active (state=1), got %', state_yesterday;
    end if;
    if state_today is not null and state_today <> 0 then
        raise exception 'grace cutoff: today should not be marked active by a 03:00 AST task, got %', state_today;
    end if;
end $$;

rollback;

\echo '✓ streak archetype tests passed'
