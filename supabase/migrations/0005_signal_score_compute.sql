-- North · signal score · compute function + daily cron (DEC-07; tracker DEC-03)
-- Implements docs/north-core-metrics-spec.md DEC-03 verbatim:
--   Positive = 0.45·A + 0.25·C + 0.30·K
--   Dampener = 1 − 0.20·V
--   Score    = round(100 · Positive · Dampener)   [internal 0–100]
-- Bands:  Drifting 0–39 · Finding 40–69 · Aligned 70–100.
-- Window: rolling 7 days ending on the supplied `target_date`.

-- ─────────────────────────────────────────────────────────────────────
-- public.compute_signal_score(uid, target_date)
-- Idempotent: UPSERT keyed on (user_id, week_ending).
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.compute_signal_score(
    uid uuid,
    target_date date default current_date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    onboarded_days int;
    active_days    int;
    assigned_a     int;     -- denominator for A
    completed_a    int;     -- numerator for A
    a_window_days  int := 7;
    a_widened      boolean := false;
    meaningful_total int;
    meaningful_focus int;
    v_count        int;     -- distinct tasks abandoned ≥ 2× in window
    a_val          numeric; -- 0..1, nullable
    c_val          numeric; -- 0..1, nullable
    k_val          numeric; -- 0..1
    v_val          numeric; -- 0..1
    positive       numeric;
    dampener       numeric;
    weight_sum     numeric;
    a_w            numeric := 0.45;
    c_w            numeric := 0.25;
    k_w            numeric := 0.30;
    v_cap          numeric := 0.20;
    raw            int;
    band_label     text;
    is_provisional boolean := false;
    held_from_prev boolean := false;
    prev_band      text;
    prev_raw       int;
    note_text      text := null;
    payload        jsonb;
begin
    -- Onboarding age (cold-start guard #1)
    select greatest(
        0,
        extract(day from (target_date::timestamp - coalesce(onboarded_at, created_at)))
    )::int
    into onboarded_days
    from public.profiles
    where user_id = uid;

    if onboarded_days is null then
        -- No profile row at all → can't compute meaningfully.
        return;
    end if;

    -- K: active days ÷ 7 over [target_date - 6, target_date]
    select count(*)
    into active_days
    from public.streaks
    where user_id = uid
      and day between target_date - 6 and target_date
      and state >= 1;
    k_val := active_days / 7.0;

    -- A: completed aligned tasks ÷ assigned aligned tasks over the window.
    -- All v0 mission tasks are aligned by construction; we count rows in
    -- user_mission_tasks created in-window.
    select count(*), count(*) filter (where done)
    into assigned_a, completed_a
    from public.user_mission_tasks
    where user_id = uid
      and created_at::date between target_date - 6 and target_date;

    if assigned_a < 7 then
        -- Spec: widen A's window to 14 days when sparse.
        a_window_days := 14;
        a_widened := true;
        select count(*), count(*) filter (where done)
        into assigned_a, completed_a
        from public.user_mission_tasks
        where user_id = uid
          and created_at::date between target_date - 13 and target_date;
    end if;

    if assigned_a > 0 then
        a_val := completed_a::numeric / assigned_a::numeric;
    else
        a_val := null;
    end if;

    -- C: meaningful in-focus ÷ meaningful total. "Meaningful" =
    -- save | matters | finish | long_dwell. "In-focus" = the
    -- content_item's focus_area_id is one of the user's focus areas.
    select count(*)
    into meaningful_total
    from public.content_interactions
    where user_id = uid
      and created_at::date between target_date - 6 and target_date
      and action in ('save','matters','finish','long_dwell');

    if meaningful_total > 0 then
        select count(*)
        into meaningful_focus
        from public.content_interactions ci
        join public.content_items ct on ct.id = ci.content_item_id
        where ci.user_id = uid
          and ci.created_at::date between target_date - 6 and target_date
          and ci.action in ('save','matters','finish','long_dwell')
          and ct.focus_area_id in (
              select focus_area_id from public.user_focus_areas where user_id = uid
          );
        c_val := meaningful_focus::numeric / meaningful_total::numeric;
    else
        c_val := null;
    end if;

    -- V: distinct aligned tasks with abandon_count ≥ 2 in window.
    -- Always look at the 7-day window for V even when A widened.
    select count(distinct id)
    into v_count
    from public.user_mission_tasks
    where user_id = uid
      and created_at::date between target_date - 6 and target_date
      and abandon_count >= 2;
    v_val := least(1.0, v_count / 3.0);

    -- Weighted positive sum with C-null renormalisation.
    if a_val is null then
        a_val := 0;
    end if;
    if c_val is null then
        weight_sum := a_w + k_w;
        positive := (a_w * a_val + k_w * k_val) / weight_sum;
    else
        positive := a_w * a_val + c_w * c_val + k_w * k_val;
    end if;

    -- Cold-start guards.
    -- (1) Brand-new or near-silent: < 7 days onboarded OR < 3 active days.
    if onboarded_days < 7 or active_days < 3 then
        is_provisional := true;
    end if;

    -- (2) Still sparse after widening: provisional + suppress dampener.
    if assigned_a < 7 then
        is_provisional := true;
        dampener := 1.0;
    else
        dampener := 1.0 - v_cap * v_val;
    end if;

    -- (3) Zero activity → hold previous band, mark provisional, note 'held'.
    if active_days = 0 and assigned_a = 0 and meaningful_total = 0 then
        select band, raw_score
        into prev_band, prev_raw
        from public.signal_scores
        where user_id = uid and week_ending < target_date
        order by week_ending desc
        limit 1;
        if prev_band is not null then
            band_label := prev_band;
            raw := prev_raw;
            is_provisional := true;
            held_from_prev := true;
            note_text := 'held';
        else
            -- No prior score either: write a Drifting provisional zero.
            raw := 0;
            band_label := 'Drifting';
            is_provisional := true;
        end if;
    else
        raw := round(100 * positive * dampener)::int;
        raw := greatest(0, least(100, raw));
        band_label := case
            when raw < 40 then 'Drifting'
            when raw < 70 then 'Finding'
            else 'Aligned'
        end;
    end if;

    payload := jsonb_build_object(
        'a', a_val,
        'c', c_val,
        'k', k_val,
        'v', v_val,
        'assigned_aligned_tasks', assigned_a,
        'completed_aligned_tasks', completed_a,
        'active_days', active_days,
        'meaningful_total', meaningful_total,
        'meaningful_in_focus', meaningful_focus,
        'abandons_ge_2', v_count,
        'weights_used', jsonb_build_object('a', a_w, 'c', case when c_val is null then 0 else c_w end, 'k', k_w),
        'avoidance_cap', v_cap,
        'window_days_for_a', a_window_days,
        'window_widened', a_widened,
        'held_from_prev', held_from_prev,
        'onboarded_days', onboarded_days,
        'note', note_text
    );

    insert into public.signal_scores
        (user_id, week_ending, band, raw_score, provisional, inputs, computed_at)
    values
        (uid, target_date, band_label, raw, is_provisional, payload, now())
    on conflict (user_id, week_ending) do update
        set band        = excluded.band,
            raw_score   = excluded.raw_score,
            provisional = excluded.provisional,
            inputs      = excluded.inputs,
            computed_at = excluded.computed_at;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- public.compute_all_signal_scores(target_date)
-- Loops over onboarded users. Called by the daily cron.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.compute_all_signal_scores(
    target_date date default current_date
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    n int := 0;
    r record;
begin
    for r in
        select user_id from public.profiles where onboarded_at is not null
    loop
        perform public.compute_signal_score(r.user_id, target_date);
        n := n + 1;
    end loop;
    return n;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Daily cron: 08:00 UTC = 04:00 AST (same as streak grace cutoff).
-- Idempotent: unschedule any previous instance of this job before
-- re-creating, so `supabase db reset` doesn't accumulate duplicates.
-- ─────────────────────────────────────────────────────────────────────
do $$
begin
    if exists (select 1 from cron.job where jobname = 'signal-score-daily') then
        perform cron.unschedule('signal-score-daily');
    end if;
end $$;

select cron.schedule(
    'signal-score-daily',
    '0 8 * * *',
    $$select public.compute_all_signal_scores(current_date)$$
);
