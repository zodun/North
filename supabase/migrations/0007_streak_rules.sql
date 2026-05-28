-- North · streak rules implementation (operating-doc DEC-08; tracker DEC-05)
-- Implements docs/north-core-metrics-spec.md DEC-05 verbatim:
--   Day = AST local calendar day (UTC−4, no DST), with 03:59 grace cutoff
--     folding overnight completions into the previous day.
--   Active day = ≥ 1 completed task         (feeds K in the signal score)
--   Directed day = all 3 of the day's mission tasks done (advances rhythm)
--   Rest = up to 2 per rolling 7; auto-consumed on a missed day, framed
--          as intentional rest, not "streak saved!"
--   Rhythm streak = current run of directed-or-rest days from today back.
--   No loss-framed pushes — that's a notification copy concern, not here.

-- ─────────────────────────────────────────────────────────────────────
-- AST day helper. America/Jamaica is permanent UTC−4 (no DST), so we
-- can avoid the timezone DB entirely and just shift by 4 hours, then
-- subtract another 4 hours to fold 00:00–03:59 local into the prior day.
-- That second shift IS the 03:59 grace cutoff in a single expression.
--   Local naive = ts at time zone 'America/Jamaica'   (yields timestamp)
--   Effective day = (local naive - interval '4 hours')::date
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.ast_day(ts timestamptz)
returns date
language sql
immutable
set search_path = public
as $$
    select ((ts at time zone 'America/Jamaica') - interval '4 hours')::date;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Classify a single day's activity for a user → state (0/1/2). Rest
-- (state 3) is assigned by apply_rest_credits below, not here.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.recompute_streak_for_day(
    uid uuid,
    target_day date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    completed_today  int;
    mission_tasks    int;
    mission_done     int;
    new_state        smallint;
begin
    -- Active = ≥ 1 task completed today (effective AST day).
    select count(*)
    into completed_today
    from public.user_mission_tasks
    where user_id = uid
      and done
      and public.ast_day(coalesce(completed_at, created_at)) = target_day;

    -- Directed = the day's mission has 3 tasks and all 3 are done.
    select count(*), count(*) filter (where done)
    into mission_tasks, mission_done
    from public.user_mission_tasks t
    join public.missions m on m.id = t.mission_id
    where t.user_id = uid
      and m.mission_date = target_day;

    if mission_tasks = 3 and mission_done = 3 then
        new_state := 2;
    elsif completed_today >= 1 then
        new_state := 1;
    else
        new_state := 0;
    end if;

    -- Don't trample an existing rest (3) by recomputing — rest is
    -- assigned by apply_rest_credits and held until the rolling-7
    -- window says otherwise.
    insert into public.streaks (user_id, day, state)
    values (uid, target_day, new_state)
    on conflict (user_id, day) do update
        set state = case
            when streaks.state = 3 and new_state = 0 then 3   -- keep rest
            else excluded.state
        end;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Apply rest credits across a rolling window. For each miss in the
-- window, if the user has < 2 rests in the trailing 7-day window
-- ending on that miss, flip it to rest.
--
-- Walks chronologically so earlier misses get the credit first — that
-- matches the "intentional rest" framing (a missed day becomes rest
-- the moment it happens, not later in arrears).
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.apply_rest_credits(
    uid uuid,
    through_day date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    r           record;
    rests_used  int;
    rest_window int := 7;     -- ⚙️ rolling-7
    rest_cap    int := 2;     -- ⚙️ 2 per rolling-7
    window_lo   date;
begin
    window_lo := through_day - 27;   -- 28-day re-eval window
    for r in
        select day, state from public.streaks
        where user_id = uid
          and day between window_lo and through_day
        order by day asc
    loop
        if r.state = 0 then
            select count(*)
            into rests_used
            from public.streaks
            where user_id = uid
              and day between r.day - (rest_window - 1) and r.day
              and state = 3
              and day <> r.day;
            if rests_used < rest_cap then
                update public.streaks
                    set state = 3
                    where user_id = uid and day = r.day;
            end if;
        end if;
    end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Orchestrator: recompute the past 7 days' states, then re-apply
-- rest credits across the 28-day eval window. Cheap; called from a
-- trigger on every task write.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.recompute_streak_window(
    uid uuid,
    target_day date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    g date;
begin
    for g in select target_day - i from generate_series(0, 6) i
    loop
        perform public.recompute_streak_for_day(uid, g);
    end loop;
    perform public.apply_rest_credits(uid, target_day);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Trigger on user_mission_tasks. Whenever `done` or `completed_at`
-- changes, recompute the affected day's streak window.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.user_mission_tasks_streak_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    effective_day date;
begin
    effective_day := public.ast_day(
        coalesce(new.completed_at, new.created_at, now())
    );
    perform public.recompute_streak_window(new.user_id, effective_day);
    return new;
end;
$$;

drop trigger if exists trg_streak_on_task_change on public.user_mission_tasks;
create trigger trg_streak_on_task_change
    after insert or update of done, completed_at
    on public.user_mission_tasks
    for each row
    execute function public.user_mission_tasks_streak_trigger();

-- ─────────────────────────────────────────────────────────────────────
-- compute_rhythm_streak — current run length of directed-or-rest
-- days, walking backwards from `as_of`. Returns 0 if today is a miss.
-- The 28-day consistency view (in the UI) reads `streaks` directly
-- and so persists through any rhythm break — that's the spec's
-- explicit "no zeroing-shame" promise.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.compute_rhythm_streak(
    uid uuid,
    as_of date default current_date
)
returns int
language plpgsql
stable
set search_path = public
as $$
declare
    n int := 0;
    r record;
begin
    for r in
        select day, state from public.streaks
        where user_id = uid and day <= as_of
        order by day desc
    loop
        if r.state in (2, 3) then
            n := n + 1;
        else
            exit;
        end if;
    end loop;
    return n;
end;
$$;
