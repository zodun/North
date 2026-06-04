-- ─────────────────────────────────────────────────────────────────────
-- Fix complete_onboarding: use INSERT ... ON CONFLICT so the RPC works
-- even when no profiles row exists yet (e.g. users whose row was missed
-- by the on_auth_user_created trigger before migrations were applied).
--
-- Also backfills any auth.users that are missing a profiles row so
-- existing test accounts are unblocked immediately.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Backfill missing profile rows for any existing auth users.
insert into public.profiles (user_id)
select id from auth.users
where id not in (select user_id from public.profiles)
on conflict (user_id) do nothing;

-- 2. Replace complete_onboarding with an upsert-safe version.
create or replace function public.complete_onboarding(
    p_focus_area_id    text,
    p_focus_area_label text,
    p_pulse_score      int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id    uuid := auth.uid();
    v_today      date := public.ast_day(now());
    v_week_end   date := v_today + ((7 - extract(isodow from v_today)::int) % 7);
    v_mission_id uuid;
begin
    if v_user_id is null then
        raise exception 'unauthenticated' using errcode = '42501';
    end if;

    if p_focus_area_id is null or p_focus_area_label is null then
        raise exception 'focus area required' using errcode = '22023';
    end if;

    if p_pulse_score is null or p_pulse_score < 1 or p_pulse_score > 5 then
        raise exception 'pulse score must be 1..5' using errcode = '22023';
    end if;

    -- Mission for today (idempotent via (user_id, mission_date) unique).
    insert into public.missions (user_id, mission_date, title, intent)
    values (
        v_user_id,
        v_today,
        'Welcome to focus on ' || p_focus_area_label,
        'a calm first step toward ' || p_focus_area_label
    )
    on conflict (user_id, mission_date) do update
        set title = excluded.title,
            intent = excluded.intent
    returning id into v_mission_id;

    -- Idempotent task seeding.
    if not exists (
        select 1 from public.user_mission_tasks
         where mission_id = v_mission_id
    ) then
        insert into public.user_mission_tasks
            (mission_id, user_id, label, kind, estimate_label)
        values
            (v_mission_id, v_user_id,
             'Read one story in ' || p_focus_area_label,
             'read', '10 min'),
            (v_mission_id, v_user_id,
             'Note one sentence about why this matters',
             'note', '5 min'),
            (v_mission_id, v_user_id,
             'Mark ' || p_focus_area_label || ' as your North for the week',
             'commit', '1 min');
    end if;

    -- Layer 1 weekly pulse for the current ISO week.
    insert into public.weekly_pulses (user_id, week_ending, score)
    values (v_user_id, v_week_end, (p_pulse_score - 1)::smallint)
    on conflict (user_id, week_ending) do update
        set score = excluded.score;

    -- Baseline endpoint row.
    insert into public.baseline_endpoint_responses
        (user_id, measurement, scale_id, items)
    values (
        v_user_id,
        'baseline',
        'north-layer1-pulse',
        jsonb_build_object('1', p_pulse_score)
    )
    on conflict (user_id, measurement) do update
        set scale_id = excluded.scale_id,
            items = excluded.items;

    -- Mark onboarding_responses complete.
    insert into public.onboarding_responses (user_id, completed_at)
    values (v_user_id, now())
    on conflict (user_id) do update
        set completed_at = excluded.completed_at;

    -- Upsert profile so this works even if the profiles row was never created.
    insert into public.profiles (user_id, onboarded_at, consent_given_at, updated_at)
    values (v_user_id, now(), now(), now())
    on conflict (user_id) do update
        set onboarded_at     = now(),
            consent_given_at = coalesce(public.profiles.consent_given_at, now()),
            updated_at       = now();
end;
$$;

revoke all on function public.complete_onboarding(text, text, int) from public;
grant execute on function public.complete_onboarding(text, text, int) to authenticated;
