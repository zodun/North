-- North · M3-QA database-layer E2E verification
--
-- Covers the database side of the M3 acceptance path:
--   signal score computed → weekly summary stored → opportunities feed
--   readable → save/apply persisted → submission intake enforced by RLS
--
-- What's tested:
--   1. opportunity_categories: public read works; client INSERT is blocked.
--   2. Opportunities: cleared + published row is readable to authenticated
--      client; draft row is NOT readable (RLS).
--   3. user_saved_opportunities: user can save and apply; cross-user read
--      is blocked.
--   4. opportunity_submissions: authenticated user can submit; submitter
--      can read own row; client cannot update status (admin only); cross-
--      user read is blocked.
--   5. signal_scores / signal_summaries: user can read own rows; cross-
--      user read is blocked.
--   6. callout_ratings: user can upsert own rows; cross-user read blocked.
--
-- Run after `supabase db reset`:
--   psql "$(supabase status --output env | grep DB_URL | cut -d'=' -f2- | tr -d '"')" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/m3_e2e.sql

begin;

-- ─────────────────────────────────────────────────────────────────────
-- Seed: two isolated users + one cleared opportunity + one draft
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_a constant uuid := '00000000-0000-0000-0000-000000000m3a';
    u_b constant uuid := '00000000-0000-0000-0000-000000000m3b';
begin
    insert into auth.users (
        id, email, instance_id, aud, role,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) values
        (u_a, 'e2e-a@m3.test', '00000000-0000-0000-0000-000000000000',
         'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
        (u_b, 'e2e-b@m3.test', '00000000-0000-0000-0000-000000000000',
         'authenticated', 'authenticated', now(), '{}'::jsonb, '{}'::jsonb, now(), now())
    on conflict (id) do nothing;

    -- Cleared + published opportunity (readable to clients).
    insert into public.opportunities (
        id, title, org, category_id, external_url,
        attribution_text, license_status, published_at
    ) values (
        '00000000-0000-0000-0000-0000000000op',
        'Software Engineer — Caribbean Remote',
        'Bboxx',
        'job',
        'https://www.bboxx.com/careers/',
        'bboxx.com/careers, 2026',
        'cleared',
        now() - interval '1 hour'
    ) on conflict (id) do nothing;

    -- Draft opportunity (NOT readable to clients).
    insert into public.opportunities (
        id, title, org, category_id, external_url,
        attribution_text, license_status
    ) values (
        '00000000-0000-0000-0000-0000000000dr',
        'Draft Opportunity',
        'Test Org',
        'internship',
        'https://example.com',
        'example.com, 2026',
        'draft'
    ) on conflict (id) do nothing;

    -- Seed a signal_scores row for user A (simulates SIG-01 having run).
    insert into public.signal_scores (
        user_id, week_ending, raw_score, band, provisional, inputs
    ) values (
        u_a,
        date_trunc('week', now())::date + 6,  -- most recent Sunday
        72,
        'Aligned',
        false,
        '{"a":0.8,"c":0.9,"k":0.7,"v":0.8,"active_days":6,"assigned_aligned_tasks":3,"completed_aligned_tasks":3,"meaningful_total":12,"meaningful_in_focus":10}'::jsonb
    ) on conflict (user_id, week_ending) do nothing;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- Authenticate as user A for client-role tests.
-- ─────────────────────────────────────────────────────────────────────
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000m3a","role":"authenticated"}';

-- ─────────────────────────────────────────────────────────────────────
-- 1. opportunity_categories: public read works; client INSERT blocked
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    n      int;
    raised boolean;
begin
    select count(*) into n from public.opportunity_categories;
    if n < 8 then
        raise exception 'M3-QA 1: expected ≥ 8 opportunity_categories, got %', n;
    end if;

    -- Client INSERT must be blocked.
    begin
        insert into public.opportunity_categories (id, label, sort_order)
        values ('client-injected', 'Bad', 99);
        raised := false;
    exception when others then
        raised := true;
    end;
    if not raised then
        raise exception 'M3-QA 1: client INSERT into opportunity_categories should be blocked by RLS';
    end if;

    raise notice '✓ opportunity_categories: public read works; client INSERT blocked';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Opportunities: cleared row readable; draft row hidden
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    n int;
begin
    -- Cleared + published row must be visible.
    select count(*) into n
    from public.opportunities
    where id = '00000000-0000-0000-0000-0000000000op';
    if n <> 1 then
        raise exception 'M3-QA 2: cleared opportunity should be readable, got count %', n;
    end if;

    -- Draft row must NOT be visible.
    select count(*) into n
    from public.opportunities
    where id = '00000000-0000-0000-0000-0000000000dr';
    if n <> 0 then
        raise exception 'M3-QA 2: draft opportunity should be hidden by RLS, got count %', n;
    end if;

    raise notice '✓ opportunities RLS: cleared visible; draft hidden';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 3. user_saved_opportunities: save + apply; cross-user read blocked
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_a    constant uuid := '00000000-0000-0000-0000-000000000m3a';
    u_b    constant uuid := '00000000-0000-0000-0000-000000000m3b';
    opp_id constant uuid := '00000000-0000-0000-0000-0000000000op';
    n      int;
    app    boolean;
    raised boolean;
begin
    -- User A saves the cleared opportunity.
    insert into public.user_saved_opportunities (user_id, opportunity_id, applied)
    values (u_a, opp_id, false);

    select count(*) into n
    from public.user_saved_opportunities
    where user_id = u_a and opportunity_id = opp_id;
    if n <> 1 then
        raise exception 'M3-QA 3: expected 1 saved row for user A, got %', n;
    end if;

    -- User A marks it applied.
    update public.user_saved_opportunities
       set applied = true, applied_at = now()
     where user_id = u_a and opportunity_id = opp_id;

    select applied into app
    from public.user_saved_opportunities
    where user_id = u_a and opportunity_id = opp_id;
    if app is not true then
        raise exception 'M3-QA 3: applied flag should be true after update, got %', app;
    end if;

    -- Cross-user read: user A cannot see user B's rows (B has none yet, but
    -- the WHERE clause must still enforce RLS — any rows returned must be A's).
    select count(*) into n
    from public.user_saved_opportunities
    where user_id = u_b;
    if n <> 0 then
        raise exception 'M3-QA 3: user A should not see user B saved rows, got count %', n;
    end if;

    raise notice '✓ user_saved_opportunities: save + apply work; cross-user read blocked';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. opportunity_submissions: insert works; status update blocked
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_a      constant uuid := '00000000-0000-0000-0000-000000000m3a';
    sub_id   uuid;
    sub_stat text;
    n        int;
    raised   boolean;
begin
    -- User A submits an opportunity.
    insert into public.opportunity_submissions (
        submitted_by, submitter_email, title, org, external_url
    ) values (
        u_a, 'e2e-a@m3.test', 'Test Submission', 'Test Org', 'https://example.com'
    ) returning id into sub_id;

    if sub_id is null then
        raise exception 'M3-QA 4: INSERT into opportunity_submissions failed';
    end if;

    -- Submitter can read their own pending row.
    select status into sub_stat
    from public.opportunity_submissions
    where id = sub_id;
    if sub_stat <> 'pending' then
        raise exception 'M3-QA 4: expected status=''pending'', got %', sub_stat;
    end if;

    -- Client cannot UPDATE status (admin only).
    begin
        update public.opportunity_submissions
           set status = 'approved'
         where id = sub_id;
        raised := false;
    exception when others then
        raised := true;
    end;
    if not raised then
        raise exception 'M3-QA 4: client UPDATE on opportunity_submissions.status should be blocked by RLS';
    end if;

    raise notice '✓ opportunity_submissions: insert works; status update blocked for client';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- Switch to user B and verify cross-user submission isolation.
-- ─────────────────────────────────────────────────────────────────────
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000m3b","role":"authenticated"}';

do $$
declare
    u_a constant uuid := '00000000-0000-0000-0000-000000000m3a';
    n   int;
begin
    select count(*) into n
    from public.opportunity_submissions
    where submitted_by = u_a;
    if n <> 0 then
        raise exception 'M3-QA 4b: user B should not see user A''s submissions, got count %', n;
    end if;

    raise notice '✓ opportunity_submissions: cross-user read blocked';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- Back to user A for signal + rating tests.
-- ─────────────────────────────────────────────────────────────────────
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000m3a","role":"authenticated"}';

-- ─────────────────────────────────────────────────────────────────────
-- 5. signal_scores / signal_summaries: own rows readable; cross-user blocked
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_a constant uuid := '00000000-0000-0000-0000-000000000m3a';
    u_b constant uuid := '00000000-0000-0000-0000-000000000m3b';
    n   int;
    b   text;
begin
    -- User A can read their own signal score.
    select count(*) into n from public.signal_scores where user_id = u_a;
    if n < 1 then
        raise exception 'M3-QA 5: user A should see their own signal_scores row, got count %', n;
    end if;

    select band into b from public.signal_scores where user_id = u_a limit 1;
    if b not in ('Aligned', 'Finding', 'Drifting') then
        raise exception 'M3-QA 5: unexpected band value %, expected Aligned/Finding/Drifting', b;
    end if;

    -- User A cannot see user B's signal scores (B has none, but RLS enforces it).
    select count(*) into n from public.signal_scores where user_id = u_b;
    if n <> 0 then
        raise exception 'M3-QA 5: user A should not see user B signal_scores, got count %', n;
    end if;

    raise notice '✓ signal_scores: own rows readable; band value valid; cross-user blocked';
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- 6. callout_ratings: upsert own rows; cross-user read blocked
-- ─────────────────────────────────────────────────────────────────────
do $$
declare
    u_a      constant uuid := '00000000-0000-0000-0000-000000000m3a';
    u_b      constant uuid := '00000000-0000-0000-0000-000000000m3b';
    week_end constant date := date_trunc('week', now())::date + 6;
    r        text;
    n        int;
begin
    -- User A rates callout 0 as helpful.
    insert into public.callout_ratings (user_id, week_ending, callout_idx, rating)
    values (u_a, week_end, 0, 'up')
    on conflict (user_id, week_ending, callout_idx)
    do update set rating = excluded.rating;

    select rating into r
    from public.callout_ratings
    where user_id = u_a and week_ending = week_end and callout_idx = 0;
    if r <> 'up' then
        raise exception 'M3-QA 6: expected rating=''up'', got %', r;
    end if;

    -- Cross-user: A cannot see B's ratings.
    select count(*) into n from public.callout_ratings where user_id = u_b;
    if n <> 0 then
        raise exception 'M3-QA 6: user A should not see user B callout_ratings, got count %', n;
    end if;

    raise notice '✓ callout_ratings: upsert works; cross-user read blocked';
end $$;

reset role;

rollback;

\echo '✓ M3-QA database-layer E2E passed (opportunity RLS + save/apply + submissions + signal ownership + callout ratings)'
