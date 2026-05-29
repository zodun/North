-- ─────────────────────────────────────────────────────────────────────
-- Onboarding completion (ONB-04 + ONB-05).
--
-- Two pieces of work:
--
--   1. Register the Layer 1 single-item weekly pulse as a real
--      alignment_scale row, so baseline_endpoint_responses can FK to a
--      *licensed* scale in M1 while the MLQ items in 0008 stay
--      placeholder-locked. Swap to MLQ when DEC-04 acquisition lands.
--
--   2. public.complete_onboarding(p_focus_area_id, p_focus_area_label,
--      p_pulse_score) — SECURITY DEFINER RPC the native client calls on
--      consent accept. Performs all the FR-ONB-02 / ONB-04 side-effects
--      atomically: starter mission + 3 tasks, weekly pulse + baseline
--      endpoint row, onboarding_responses.completed_at, profiles
--      onboarded_at / consent_given_at. The streaks trigger from 0007
--      auto-initialises the user's streak row when the first
--      user_mission_tasks row inserts.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Layer 1 pulse as a licensed scale (M1 stand-in for MLQ).
insert into public.alignment_scales
    (id, label, source_citation, scale_min, scale_max, license_status)
values (
    'north-layer1-pulse',
    'North weekly pulse (single-item, 1–5 scale)',
    'North operating doc §3.3 (FR-ONB-* / DEC-04 Layer 1 — internal item)',
    1, 5,
    'licensed'
)
on conflict (id) do update
    set label = excluded.label,
        source_citation = excluded.source_citation,
        scale_min = excluded.scale_min,
        scale_max = excluded.scale_max,
        license_status = excluded.license_status;

insert into public.alignment_scale_items
    (scale_id, ordering, prompt, reverse_scored)
values
    ('north-layer1-pulse', 1,
     'In a typical week, how much of your time goes toward what matters to you?',
     false)
on conflict (scale_id, ordering) do update
    set prompt = excluded.prompt,
        reverse_scored = excluded.reverse_scored;

-- 2. Atomic completion RPC.
--
-- Storage convention for the pulse score:
--   - p_pulse_score is the conceptual 1..5 value the user picked
--     (Not at all / A little / Somewhat / Mostly / Fully).
--   - baseline_endpoint_responses.items stores it as-is (1..5).
--   - weekly_pulses.score stores p_pulse_score - 1 to satisfy the
--     existing 0..4 CHECK constraint from 0001_init.sql.
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

    -- Idempotent task seeding: only insert the 3 starter tasks if
    -- this mission has no tasks yet. Lets the RPC be re-run safely
    -- without duplicating the welcome checklist.
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

    -- Baseline endpoint row (composite is auto-computed by
    -- trg_alignment_composite from 0008_alignment_instrument.sql).
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

    -- Mark onboarding_responses complete (row may already exist from
    -- per-question upserts during the flow).
    insert into public.onboarding_responses (user_id, completed_at)
    values (v_user_id, now())
    on conflict (user_id) do update
        set completed_at = excluded.completed_at;

    -- Final profile state: onboarded + consent timestamp.
    update public.profiles
       set onboarded_at      = now(),
           consent_given_at  = coalesce(consent_given_at, now()),
           updated_at        = now()
     where user_id = v_user_id;
end;
$$;

revoke all on function public.complete_onboarding(text, text, int) from public;
grant execute on function public.complete_onboarding(text, text, int) to authenticated;
