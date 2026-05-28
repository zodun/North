-- North · alignment instrument · tests (operating-doc DEC-09; tracker DEC-04)
--
-- Run against a fresh local Supabase:
--   supabase db reset
--   psql "$(supabase status --output env | grep DB_URL | cut -d'=' -f2- | tr -d '"')" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/alignment_instrument.sql

begin;

-- ─────────────────────────────────────────────────────────────────────
-- 1. License gate · with the seed scale still pending_acquisition,
--    items must be invisible under RLS to a non-admin role.
--    We simulate the anon perspective by temporarily switching role.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    n int;
begin
    -- As superuser/owner we can still see rows directly; switch to anon.
    set local role anon;
    select count(*) into n from public.alignment_scale_items where scale_id = 'mlq-pom';
    if n <> 0 then
        raise exception 'license gate: expected 0 items visible to anon while pending_acquisition, got %', n;
    end if;
    -- Restore for the rest of the test.
    reset role;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. License flip · after operator switches to 'licensed', anon
--    should see all 5 items.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    n int;
begin
    update public.alignment_scales
       set license_status = 'licensed',
           license_evidence_url = 'https://example.test/operator-evidence.pdf'
       where id = 'mlq-pom';

    set local role anon;
    select count(*) into n from public.alignment_scale_items where scale_id = 'mlq-pom';
    if n <> 5 then
        raise exception 'license gate: expected 5 items visible to anon when licensed, got %', n;
    end if;
    reset role;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Composite computation · a uniform response of 4 across 5 items
--    must yield composite = 4.0, after reverse-scoring item 5
--    (placeholder is flagged reverse_scored=true in the seed).
--
--    For uniform 4 on 1–7 scale: reverse of 4 = (1+7) − 4 = 4 → still 4.
--    Composite = (4·5)/5 = 4.0.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_uniform constant uuid := '00000000-0000-0000-0000-000000000201';
    onboarded constant timestamptz := '2026-05-01'::timestamptz;
    actual numeric;
begin
    insert into auth.users (id, email, instance_id, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (u_uniform, 'uniform@align.test', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded)
    on conflict (id) do nothing;

    insert into public.baseline_endpoint_responses
        (user_id, measurement, items, scale_id)
    values
        (u_uniform, 'baseline',
         '{"1":4,"2":4,"3":4,"4":4,"5":4}'::jsonb,
         'mlq-pom');

    select composite into actual
    from public.baseline_endpoint_responses
    where user_id = u_uniform and measurement = 'baseline';
    if actual is null or abs(actual - 4.0) > 0.001 then
        raise exception 'composite: expected 4.0, got %', actual;
    end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. Reverse-scoring · response {7,1,7,1,1} with only item 5
--    reverse-scored should yield (7+1+7+1+7)/5 = 4.6.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_rev constant uuid := '00000000-0000-0000-0000-000000000202';
    onboarded constant timestamptz := '2026-05-01'::timestamptz;
    actual numeric;
begin
    insert into auth.users (id, email, instance_id, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (u_rev, 'reverse@align.test', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded)
    on conflict (id) do nothing;

    insert into public.baseline_endpoint_responses
        (user_id, measurement, items, scale_id)
    values
        (u_rev, 'baseline',
         '{"1":7,"2":1,"3":7,"4":1,"5":1}'::jsonb,
         'mlq-pom');

    select composite into actual
    from public.baseline_endpoint_responses
    where user_id = u_rev and measurement = 'baseline';
    -- Item 5 reverses: (1+7) − 1 = 7. Sum = 7+1+7+1+7 = 23. /5 = 4.6.
    if actual is null or abs(actual - 4.6) > 0.001 then
        raise exception 'reverse-scoring: expected 4.6, got %', actual;
    end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 5. weekly_pulse_due · new user → true; user with a pulse this week → false.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_new constant uuid := '00000000-0000-0000-0000-000000000203';
    u_pulsed constant uuid := '00000000-0000-0000-0000-000000000204';
    onboarded constant timestamptz := '2026-05-01'::timestamptz;
    week_end date := '2026-05-31';   -- Sunday
    due_new boolean; due_pulsed boolean;
begin
    insert into auth.users (id, email, instance_id, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
        (u_new,    'new@align.test',    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded),
        (u_pulsed, 'pulsed@align.test', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded)
    on conflict (id) do nothing;

    insert into public.weekly_pulses (user_id, week_ending, score)
    values (u_pulsed, week_end, 3);

    due_new    := public.weekly_pulse_due(u_new,    week_end);
    due_pulsed := public.weekly_pulse_due(u_pulsed, week_end);
    if due_new is not true then
        raise exception 'weekly_pulse_due: new user should be due, got %', due_new;
    end if;
    if due_pulsed is not false then
        raise exception 'weekly_pulse_due: pulsed user should not be due, got %', due_pulsed;
    end if;
end $$;

rollback;

\echo '✓ alignment instrument tests passed'
