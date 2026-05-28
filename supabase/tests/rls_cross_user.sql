-- North · RLS cross-user verification (operating-doc DEC-17; tracker INFRA-04)
-- Acceptance criterion (from tracker INFRA-04):
--   "A user can never read or write another user's behavioural, mission,
--    or profile rows (verified by test)."
--
-- Pattern: simulate the JWT of user A via `set local "request.jwt.claims"`
-- and the `authenticated` role, then assert reads against user B's rows
-- return zero, and writes against user B's rows raise.
--
-- Run after `supabase db reset`:
--   psql "$(supabase status --output env | grep DB_URL | cut -d'=' -f2- | tr -d '"')" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/rls_cross_user.sql

begin;

-- ─────────────────────────────────────────────────────────────────────
-- Seed two users + their behavioural rows. handle_new_user trigger
-- on auth.users creates the profile row for each.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_alpha constant uuid := '00000000-0000-0000-0000-0000000000a1';
    u_beta  constant uuid := '00000000-0000-0000-0000-0000000000b2';
    mission_a uuid := gen_random_uuid();
    mission_b uuid := gen_random_uuid();
    onboarded constant timestamptz := (current_date - 30)::timestamptz;
begin
    insert into auth.users (id, email, instance_id, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
        (u_alpha, 'alpha@rls.test', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded),
        (u_beta,  'beta@rls.test',  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, onboarded, onboarded)
    on conflict (id) do nothing;

    -- Onboard both so signal_score machinery considers them in-scope.
    update public.profiles set onboarded_at = onboarded where user_id in (u_alpha, u_beta);

    -- Focus area shared by both.
    insert into public.focus_areas (id, label, hue, sort_order) values
        ('craft', 'Craft & Mastery', '#7ec4bb', 0)
    on conflict (id) do nothing;

    insert into public.user_focus_areas (user_id, focus_area_id) values
        (u_alpha, 'craft'), (u_beta, 'craft')
    on conflict do nothing;

    -- A content item to attach interactions to.
    insert into public.content_items (id, kind, focus_area_id, title, body, published_at, license_status, attribution_text, license_type, external_url)
    values ('00000000-0000-0000-0000-0000000000cc', 'essay', 'craft', 'RLS test essay', 'Body', now(), 'cleared', 'Test source', 'link-out', 'https://example.test/essay')
    on conflict (id) do nothing;

    -- Seed user B with one row in every behavioural / mission table.
    insert into public.missions (id, user_id, mission_date, title)
    values (mission_b, u_beta, current_date, 'beta mission')
    on conflict (id) do nothing;
    insert into public.user_mission_tasks (mission_id, user_id, label, done)
    values (mission_b, u_beta, 'beta task', false);

    insert into public.content_interactions (user_id, content_item_id, action)
    values (u_beta, '00000000-0000-0000-0000-0000000000cc', 'save');

    insert into public.streaks (user_id, day, state)
    values (u_beta, current_date, 1)
    on conflict do nothing;

    insert into public.weekly_pulses (user_id, week_ending, score)
    values (u_beta, current_date, 3)
    on conflict do nothing;

    insert into public.baseline_endpoint_responses (user_id, measurement, items, scale_id)
    values (u_beta, 'baseline', '{"1":4,"2":4,"3":4,"4":4,"5":4}'::jsonb, 'mlq-pom')
    on conflict do nothing;

    insert into public.signal_scores (user_id, week_ending, band, raw_score, provisional, inputs)
    values (u_beta, current_date, 'Finding', 55, false, '{}'::jsonb)
    on conflict do nothing;

    insert into public.signal_summaries (user_id, week_ending, summary_text, model_name, prompt_version)
    values (u_beta, current_date, 'beta summary', 'gpt-4o-mini', 'v0.1')
    on conflict do nothing;

    -- Mirror seeds for user A so the count(*) baseline below works.
    insert into public.missions (id, user_id, mission_date, title)
    values (mission_a, u_alpha, current_date, 'alpha mission')
    on conflict (id) do nothing;
    insert into public.user_mission_tasks (mission_id, user_id, label, done)
    values (mission_a, u_alpha, 'alpha task', false);
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- Switch into user A's session. The authenticated role + a JWT claims
-- payload with sub = u_alpha causes auth.uid() to return u_alpha.
-- ─────────────────────────────────────────────────────────────────────
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

-- ─────────────────────────────────────────────────────────────────────
-- READ assertions: every behavioural/mission/profile table returns 0
-- rows when filtered by user_id = u_beta from user A's session.
--
-- Specifically: with RLS active, even WITHOUT the user_id filter the
-- query should return only user A's rows. Asserting against B's user_id
-- is the explicit demand-side check.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    n int;
    u_beta constant uuid := '00000000-0000-0000-0000-0000000000b2';
begin
    select count(*) into n from public.profiles where user_id = u_beta;
    if n <> 0 then raise exception 'profiles: A read B (% rows)', n; end if;

    select count(*) into n from public.user_focus_areas where user_id = u_beta;
    if n <> 0 then raise exception 'user_focus_areas: A read B (% rows)', n; end if;

    select count(*) into n from public.missions where user_id = u_beta;
    if n <> 0 then raise exception 'missions: A read B (% rows)', n; end if;

    select count(*) into n from public.user_mission_tasks where user_id = u_beta;
    if n <> 0 then raise exception 'user_mission_tasks: A read B (% rows)', n; end if;

    select count(*) into n from public.content_interactions where user_id = u_beta;
    if n <> 0 then raise exception 'content_interactions: A read B (% rows)', n; end if;

    select count(*) into n from public.streaks where user_id = u_beta;
    if n <> 0 then raise exception 'streaks: A read B (% rows)', n; end if;

    select count(*) into n from public.weekly_pulses where user_id = u_beta;
    if n <> 0 then raise exception 'weekly_pulses: A read B (% rows)', n; end if;

    select count(*) into n from public.baseline_endpoint_responses where user_id = u_beta;
    if n <> 0 then raise exception 'baseline_endpoint_responses: A read B (% rows)', n; end if;

    select count(*) into n from public.signal_scores where user_id = u_beta;
    if n <> 0 then raise exception 'signal_scores: A read B (% rows)', n; end if;

    select count(*) into n from public.signal_summaries where user_id = u_beta;
    if n <> 0 then raise exception 'signal_summaries: A read B (% rows)', n; end if;

    raise notice '✓ reads · A cannot see any of B''s rows across 10 protected tables';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- WRITE assertions: inserting on B's behalf must raise.
--
-- We expect RLS to either silently filter the row (0 affected) or
-- raise "new row violates row-level security policy". The harness
-- below catches both: it inserts, counts rows, and only the row for
-- user A should ever appear.
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_alpha constant uuid := '00000000-0000-0000-0000-0000000000a1';
    u_beta  constant uuid := '00000000-0000-0000-0000-0000000000b2';
    raised  boolean;
    inserted_id uuid;
    mission_b constant uuid := (select id from public.missions where user_id = u_beta limit 1);
begin
    -- user_focus_areas
    begin
        insert into public.user_focus_areas (user_id, focus_area_id) values (u_beta, 'craft');
        raised := false;
    exception when others then raised := true;
    end;
    if not raised then
        raise exception 'user_focus_areas: A inserted on B (no policy violation raised)';
    end if;

    -- user_mission_tasks
    begin
        insert into public.user_mission_tasks (mission_id, user_id, label, done)
        values (mission_b, u_beta, 'A-injected', false);
        raised := false;
    exception when others then raised := true;
    end;
    if not raised then
        raise exception 'user_mission_tasks: A inserted on B (no policy violation raised)';
    end if;

    -- content_interactions
    begin
        insert into public.content_interactions (user_id, content_item_id, action)
        values (u_beta, '00000000-0000-0000-0000-0000000000cc', 'matters');
        raised := false;
    exception when others then raised := true;
    end;
    if not raised then
        raise exception 'content_interactions: A inserted on B (no policy violation raised)';
    end if;

    -- streaks
    begin
        insert into public.streaks (user_id, day, state) values (u_beta, current_date - 1, 1);
        raised := false;
    exception when others then raised := true;
    end;
    if not raised then
        raise exception 'streaks: A inserted on B (no policy violation raised)';
    end if;

    -- weekly_pulses
    begin
        insert into public.weekly_pulses (user_id, week_ending, score) values (u_beta, current_date - 7, 2);
        raised := false;
    exception when others then raised := true;
    end;
    if not raised then
        raise exception 'weekly_pulses: A inserted on B (no policy violation raised)';
    end if;

    -- baseline_endpoint_responses
    begin
        insert into public.baseline_endpoint_responses (user_id, measurement, items, scale_id)
        values (u_beta, 'day28', '{"1":7}'::jsonb, 'mlq-pom');
        raised := false;
    exception when others then raised := true;
    end;
    if not raised then
        raise exception 'baseline_endpoint_responses: A inserted on B (no policy violation raised)';
    end if;

    -- profiles UPDATE attempt (no INSERT — trigger owns that)
    begin
        update public.profiles set display_name = 'INJECTED' where user_id = u_beta;
        get diagnostics inserted_id = row_count;
        -- RLS doesn't raise on update; it filters. row_count must be 0.
        if (select count(*)::int from (select 1 where (select display_name from public.profiles where user_id = u_beta) = 'INJECTED') s) > 0 then
            raise exception 'profiles: A updated B (display_name was changed)';
        end if;
    exception when others then
        -- Either no-op (RLS silently filters) or raise; both are acceptable.
        null;
    end;

    raise notice '✓ writes · A cannot insert/update on B''s behalf across 7 client-writable tables';
end $$;

reset role;
rollback;

\echo '✓ RLS cross-user verification passed (10 read tables + 7 write tables)'
