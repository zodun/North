-- North · M1-QA database-layer E2E verification
--
-- Covers the database side of the M1 acceptance path:
--   sign up → complete_onboarding → scroll feed → interactions captured
--
-- What's tested:
--   1. complete_onboarding RPC atomically creates: mission + 3 tasks,
--      weekly_pulse, baseline_endpoint_responses, and flips
--      profiles.onboarded_at + consent_given_at.
--   2. content_interactions accepts rows with context columns
--      (content_category_id, kind) from SIGCAP-01.
--   3. content_interactions is append-only: UPDATE and DELETE raise
--      under the owner's session (0017_signal_cap_context.sql RLS).
--   4. Users can read back their own interactions (isSaved / isMatters
--      hydration path).
--
-- Run after `supabase db reset`:
--   psql "$(supabase status --output env | grep DB_URL | cut -d'=' -f2- | tr -d '"')" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/m1_e2e.sql

begin;

-- ─────────────────────────────────────────────────────────────────────
-- Seed
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_id constant uuid := '00000000-0000-0000-0000-000000000e2e';
begin
    insert into auth.users (
        id, email, instance_id, aud, role,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) values (
        u_id, 'e2e@m1.test', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        now(), '{}'::jsonb, '{}'::jsonb, now(), now()
    ) on conflict (id) do nothing;
    -- handle_new_user trigger creates the profiles row automatically.

    -- Focus area needed by complete_onboarding.
    insert into public.focus_areas (id, label, hue, sort_order)
    values ('craft', 'Craft & Mastery', '#7ec4bb', 0)
    on conflict (id) do nothing;

    -- Content item + category for interaction assertions.
    insert into public.content_categories (id, label, sort_order)
    values ('entrepreneurship', 'Entrepreneurship', 1)
    on conflict (id) do nothing;

    insert into public.content_items (
        id, kind, title, published_at, license_status,
        attribution_text, license_type, external_url,
        content_category_id, sort_order
    ) values (
        '00000000-0000-0000-0000-e2e000000001',
        'essay', 'E2E test essay', now(), 'cleared',
        'E2E source', 'link-out', 'https://example.test/e2e',
        'entrepreneurship', 1
    ) on conflict (id) do nothing;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 1. complete_onboarding — call as the test user
-- ─────────────────────────────────────────────────────────────────────
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000e2e","role":"authenticated"}';

select public.complete_onboarding('craft', 'Craft & Mastery', 3);

do $$
declare
    u_id constant uuid := '00000000-0000-0000-0000-000000000e2e';
    n    int;
    ts   timestamptz;
begin
    -- profiles: both timestamps set
    select onboarded_at into ts from public.profiles where user_id = u_id;
    if ts is null then
        raise exception 'M1-QA: profiles.onboarded_at is null after complete_onboarding';
    end if;

    select consent_given_at into ts from public.profiles where user_id = u_id;
    if ts is null then
        raise exception 'M1-QA: profiles.consent_given_at is null after complete_onboarding';
    end if;

    -- mission + 3 tasks
    select count(*) into n from public.missions where user_id = u_id;
    if n <> 1 then
        raise exception 'M1-QA: expected 1 mission, got %', n;
    end if;

    select count(*) into n
    from public.user_mission_tasks t
    join public.missions m on m.id = t.mission_id
    where m.user_id = u_id;
    if n <> 3 then
        raise exception 'M1-QA: expected 3 starter tasks, got %', n;
    end if;

    -- weekly_pulse
    select count(*) into n from public.weekly_pulses where user_id = u_id;
    if n <> 1 then
        raise exception 'M1-QA: expected 1 weekly_pulse, got %', n;
    end if;

    -- baseline_endpoint_responses
    select count(*) into n
    from public.baseline_endpoint_responses
    where user_id = u_id and measurement = 'baseline';
    if n <> 1 then
        raise exception 'M1-QA: expected 1 baseline response, got %', n;
    end if;

    raise notice '✓ complete_onboarding: all M1 rows created (mission + tasks + pulse + baseline + consent)';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. content_interactions — SIGCAP context columns captured
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_id     constant uuid := '00000000-0000-0000-0000-000000000e2e';
    item_id  constant uuid := '00000000-0000-0000-0000-e2e000000001';
    n        int;
    cat      text;
    knd      text;
begin
    insert into public.content_interactions
        (user_id, content_item_id, action, dwell_ms, content_category_id, kind)
    values
        (u_id, item_id, 'view',       null,   'entrepreneurship', 'essay'),
        (u_id, item_id, 'long_dwell', 30000,  'entrepreneurship', 'essay'),
        (u_id, item_id, 'save',       null,   'entrepreneurship', 'essay');

    -- Context columns populated
    select content_category_id, kind into cat, knd
    from public.content_interactions
    where user_id = u_id and action = 'save';

    if cat is distinct from 'entrepreneurship' then
        raise exception 'M1-QA: content_category_id wrong (got %)', cat;
    end if;
    if knd is distinct from 'essay' then
        raise exception 'M1-QA: kind wrong (got %)', knd;
    end if;

    -- All 3 rows readable by the owner
    select count(*) into n
    from public.content_interactions
    where user_id = u_id;
    if n <> 3 then
        raise exception 'M1-QA: expected 3 interaction rows, got %', n;
    end if;

    raise notice '✓ content_interactions: context columns captured; owner can read back own rows';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Append-only enforcement — UPDATE must raise under RLS
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_id    constant uuid := '00000000-0000-0000-0000-000000000e2e';
    item_id constant uuid := '00000000-0000-0000-0000-e2e000000001';
    raised  boolean;
begin
    -- UPDATE should raise "new row violates row-level security policy"
    begin
        update public.content_interactions
           set action = 'matters'
         where user_id = u_id and action = 'view';
        raised := false;
    exception when others then
        raised := true;
    end;
    if not raised then
        raise exception 'M1-QA: content_interactions UPDATE did not raise (append-only policy broken)';
    end if;

    -- DELETE should raise
    begin
        delete from public.content_interactions
         where user_id = u_id and action = 'view';
        raised := false;
    exception when others then
        raised := true;
    end;
    if not raised then
        raise exception 'M1-QA: content_interactions DELETE did not raise (append-only policy broken)';
    end if;

    raise notice '✓ content_interactions: append-only enforced (UPDATE and DELETE raise under owner session)';
end $$;

reset role;
rollback;

\echo '✓ M1-QA database-layer E2E passed (onboarding completion + SIGCAP capture + append-only RLS)'
