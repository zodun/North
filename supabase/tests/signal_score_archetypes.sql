-- North · signal score · archetype tests (DEC-07 verification)
--
-- Run against a fresh local Supabase instance:
--   supabase db reset
--   psql "$(supabase status --output env | grep DB_URL | cut -d'=' -f2- | tr -d '\"')" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/signal_score_archetypes.sql
--
-- Each archetype asserts the band, provisional flag, and a tight raw_score
-- window. Failures raise an exception with the expected vs. actual.

begin;

-- ─────────────────────────────────────────────────────────────────────
-- Deterministic UUIDs for repeatable test runs.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_hero    constant uuid := '00000000-0000-0000-0000-000000000001';
    u_lurker  constant uuid := '00000000-0000-0000-0000-000000000002';
    u_avoider constant uuid := '00000000-0000-0000-0000-000000000003';
    u_back    constant uuid := '00000000-0000-0000-0000-000000000004';
    target    constant date := '2026-05-28';   -- Thursday; fixed so window is deterministic
    onboard_far  constant timestamptz := (target - 30)::timestamptz;
    onboard_near constant timestamptz := (target - 14)::timestamptz;
begin
    -- Seed auth.users (minimal columns; rest fall back to defaults).
    insert into auth.users (id, email, instance_id, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
        (u_hero,    'hero@test.north',    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboard_far, onboard_far),
        (u_lurker,  'lurker@test.north',  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboard_far, onboard_far),
        (u_avoider, 'avoider@test.north', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboard_far, onboard_far),
        (u_back,    'back@test.north',    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboard_near, onboard_near)
    on conflict (id) do nothing;

    -- Mark onboarded (the handle_new_user trigger creates profile rows with onboarded_at = null).
    update public.profiles set onboarded_at = onboard_far where user_id in (u_hero, u_lurker, u_avoider);
    update public.profiles set onboarded_at = onboard_near where user_id = u_back;

    -- Focus areas: one shared focus area for all test users.
    insert into public.focus_areas (id, label, hue, sort_order) values
        ('craft', 'Craft & Mastery', '#7ec4bb', 0)
    on conflict (id) do nothing;
    insert into public.user_focus_areas (user_id, focus_area_id) values
        (u_hero, 'craft'), (u_lurker, 'craft'), (u_avoider, 'craft'), (u_back, 'craft')
    on conflict do nothing;

    -- One published content item in-focus so engagement coherence can be computed.
    insert into public.content_items (id, kind, focus_area_id, title, body, published_at)
    values ('00000000-0000-0000-0000-0000000000aa', 'essay', 'craft', 'Test essay', 'Body', now())
    on conflict (id) do nothing;

    -- ───────────────────────── STREAK-HERO ─────────────────────────
    -- 7 active days · 21/21 tasks done · 18/18 in-focus engagements · 0 abandons
    -- Expected: Aligned, raw_score = 100 (or very close).
    insert into public.streaks (user_id, day, state)
    select u_hero, target - g, 2 from generate_series(0, 6) g
    on conflict do nothing;

    -- Need a mission to satisfy the FK.
    insert into public.missions (id, user_id, mission_date, title)
    select '00000000-0000-0000-0000-000000010000'::uuid, u_hero, target, 'hero mission'
    where not exists (select 1 from public.missions where id = '00000000-0000-0000-0000-000000010000');

    -- 21 tasks across the 7 days, all done.
    insert into public.user_mission_tasks (id, mission_id, user_id, label, done, created_at, completed_at)
    select
        ('00000000-0000-0000-0000-0000000100' || lpad(g::text, 2, '0'))::uuid,
        '00000000-0000-0000-0000-000000010000'::uuid,
        u_hero,
        'hero task ' || g,
        true,
        (target - (g % 7))::timestamptz + (interval '6h'),
        (target - (g % 7))::timestamptz + (interval '7h')
    from generate_series(0, 20) g
    on conflict (id) do nothing;

    -- 18 meaningful engagements, all in-focus.
    insert into public.content_interactions (user_id, content_item_id, action, created_at)
    select
        u_hero,
        '00000000-0000-0000-0000-0000000000aa'::uuid,
        'save',
        (target - (g % 7))::timestamptz + (interval '10h')
    from generate_series(0, 17) g;

    -- ───────────────────────── LURKER ─────────────────────────
    -- 5 active days · 3/15 tasks done · 2/12 in-focus engagements · 0 abandons
    -- Expected: Drifting, raw_score ≈ 35.
    insert into public.streaks (user_id, day, state)
    select u_lurker, target - g, 1 from generate_series(0, 4) g    -- 5 active days
    on conflict do nothing;

    insert into public.missions (id, user_id, mission_date, title)
    select '00000000-0000-0000-0000-000000020000'::uuid, u_lurker, target, 'lurker mission'
    where not exists (select 1 from public.missions where id = '00000000-0000-0000-0000-000000020000');

    -- 15 tasks, 3 done.
    insert into public.user_mission_tasks (id, mission_id, user_id, label, done, created_at, completed_at)
    select
        ('00000000-0000-0000-0000-0000000200' || lpad(g::text, 2, '0'))::uuid,
        '00000000-0000-0000-0000-000000020000'::uuid,
        u_lurker,
        'lurker task ' || g,
        (g < 3),
        (target - (g % 7))::timestamptz + (interval '6h'),
        case when g < 3 then (target - (g % 7))::timestamptz + (interval '7h') else null end
    from generate_series(0, 14) g
    on conflict (id) do nothing;

    -- 2 in-focus + 10 out-of-focus engagements = 12 total, 2 in-focus.
    insert into public.content_items (id, kind, focus_area_id, title, body, published_at)
    values ('00000000-0000-0000-0000-0000000000bb', 'essay', null, 'Off-focus essay', 'Body', now())
    on conflict (id) do nothing;

    insert into public.content_interactions (user_id, content_item_id, action, created_at)
    select u_lurker, '00000000-0000-0000-0000-0000000000aa'::uuid, 'save', target::timestamptz + (interval '10h')
    from generate_series(0, 1);

    insert into public.content_interactions (user_id, content_item_id, action, created_at)
    select u_lurker, '00000000-0000-0000-0000-0000000000bb'::uuid, 'save', target::timestamptz + (interval '11h')
    from generate_series(0, 9);

    -- ───────────────────────── AVOIDER ─────────────────────────
    -- 6 active days · 14/20 tasks done · 10/15 in-focus · 2 tasks abandon_count=2
    -- Expected: Finding, dampener bites; score ≈ 64.
    insert into public.streaks (user_id, day, state)
    select u_avoider, target - g, 1 from generate_series(0, 5) g
    on conflict do nothing;

    insert into public.missions (id, user_id, mission_date, title)
    select '00000000-0000-0000-0000-000000030000'::uuid, u_avoider, target, 'avoider mission'
    where not exists (select 1 from public.missions where id = '00000000-0000-0000-0000-000000030000');

    -- 20 tasks, 14 done, 2 of the un-done have abandon_count=2.
    insert into public.user_mission_tasks (id, mission_id, user_id, label, done, abandon_count, created_at, completed_at)
    select
        ('00000000-0000-0000-0000-0000000300' || lpad(g::text, 2, '0'))::uuid,
        '00000000-0000-0000-0000-000000030000'::uuid,
        u_avoider,
        'avoider task ' || g,
        (g < 14),
        case when g in (15, 16) then 2 else 0 end,
        (target - (g % 7))::timestamptz + (interval '6h'),
        case when g < 14 then (target - (g % 7))::timestamptz + (interval '7h') else null end
    from generate_series(0, 19) g
    on conflict (id) do nothing;

    -- 10 in-focus + 5 out-of-focus = 15 total, 10 in-focus.
    insert into public.content_interactions (user_id, content_item_id, action, created_at)
    select u_avoider, '00000000-0000-0000-0000-0000000000aa'::uuid, 'save', target::timestamptz + (interval '10h')
    from generate_series(0, 9);

    insert into public.content_interactions (user_id, content_item_id, action, created_at)
    select u_avoider, '00000000-0000-0000-0000-0000000000bb'::uuid, 'save', target::timestamptz + (interval '11h')
    from generate_series(0, 4);

    -- ───────────────────────── COMEBACK ─────────────────────────
    -- 7 active days · only 5 tasks in 7-day window · 0 in 8-14 day window
    -- (under sparse-A threshold even after widening) → provisional.
    insert into public.streaks (user_id, day, state)
    select u_back, target - g, 1 from generate_series(0, 6) g
    on conflict do nothing;

    insert into public.missions (id, user_id, mission_date, title)
    select '00000000-0000-0000-0000-000000040000'::uuid, u_back, target, 'back mission'
    where not exists (select 1 from public.missions where id = '00000000-0000-0000-0000-000000040000');

    insert into public.user_mission_tasks (id, mission_id, user_id, label, done, created_at, completed_at)
    select
        ('00000000-0000-0000-0000-0000000400' || lpad(g::text, 2, '0'))::uuid,
        '00000000-0000-0000-0000-000000040000'::uuid,
        u_back,
        'back task ' || g,
        true,
        (target - (g % 5))::timestamptz + (interval '6h'),
        (target - (g % 5))::timestamptz + (interval '7h')
    from generate_series(0, 4) g
    on conflict (id) do nothing;

    -- ───────────────────────── COMPUTE ─────────────────────────
    perform public.compute_signal_score(u_hero, target);
    perform public.compute_signal_score(u_lurker, target);
    perform public.compute_signal_score(u_avoider, target);
    perform public.compute_signal_score(u_back, target);
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- Assertions. Each `do` block raises an exception on failure with the
-- actual value, so `psql -v ON_ERROR_STOP=1` exits non-zero.
-- ─────────────────────────────────────────────────────────────────────

do $$
declare r record;
begin
    select * into r from public.signal_scores
    where user_id = '00000000-0000-0000-0000-000000000001' and week_ending = '2026-05-28';
    if r.band <> 'Aligned' or r.raw_score < 95 or r.provisional then
        raise exception 'streak-hero: expected Aligned ≥ 95 not-provisional, got band=% raw=% prov=%', r.band, r.raw_score, r.provisional;
    end if;
end $$;

do $$
declare r record;
begin
    select * into r from public.signal_scores
    where user_id = '00000000-0000-0000-0000-000000000002' and week_ending = '2026-05-28';
    if r.band <> 'Drifting' or r.raw_score >= 40 or r.provisional then
        raise exception 'lurker: expected Drifting < 40 not-provisional, got band=% raw=% prov=%', r.band, r.raw_score, r.provisional;
    end if;
end $$;

do $$
declare r record; r_no_avoid int;
begin
    select * into r from public.signal_scores
    where user_id = '00000000-0000-0000-0000-000000000003' and week_ending = '2026-05-28';
    if r.band <> 'Finding' or r.raw_score < 55 or r.raw_score > 72 or r.provisional then
        raise exception 'avoider: expected Finding 55–72 not-provisional, got band=% raw=% prov=%', r.band, r.raw_score, r.provisional;
    end if;
    -- Dampener should have bitten: v in inputs > 0.
    if (r.inputs->>'v')::numeric <= 0 then
        raise exception 'avoider: dampener inactive, v=%', r.inputs->>'v';
    end if;
end $$;

do $$
declare r record;
begin
    select * into r from public.signal_scores
    where user_id = '00000000-0000-0000-0000-000000000004' and week_ending = '2026-05-28';
    if not r.provisional then
        raise exception 'comeback: expected provisional=true, got prov=% inputs=%', r.provisional, r.inputs;
    end if;
    if (r.inputs->>'window_widened')::boolean is not true then
        raise exception 'comeback: expected window_widened=true, got inputs=%', r.inputs;
    end if;
end $$;

-- Idempotency: re-running compute does not duplicate rows.
do $$
declare n int;
begin
    perform public.compute_signal_score('00000000-0000-0000-0000-000000000001', '2026-05-28');
    select count(*) into n from public.signal_scores
    where user_id = '00000000-0000-0000-0000-000000000001' and week_ending = '2026-05-28';
    if n <> 1 then
        raise exception 'idempotency: expected 1 row after re-compute, got %', n;
    end if;
end $$;

rollback;

\echo '✓ signal score archetype tests passed'
