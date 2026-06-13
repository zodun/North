-- ─────────────────────────────────────────────────────────────────────
-- Monthly missions (MONTH-01)
--
-- Every user gets one goal per calendar month, built around their top focus
-- area. The goal is broken into:
--   • 4 weekly milestones        (cadence = 'weekly')
--   • one small step per day      (cadence = 'daily', each pointing at that
--                                  week's milestone)
-- The user chooses which cadence drives their Task tab via
-- profiles.mission_cadence. Generation is template-based (deterministic, no
-- external API) so it works for everyone via cron and on first load.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Per-user cadence preference ─────────────────────────────────────────────
alter table public.profiles
    add column if not exists mission_cadence text not null default 'daily'
        check (mission_cadence in ('daily', 'weekly'));

-- 2. The month's goal ────────────────────────────────────────────────────────
create table if not exists public.monthly_missions (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users (id) on delete cascade,
    month_start   date not null,
    goal_title    text not null,
    goal_intent   text,
    focus_area_id text,
    generated_by  text not null default 'template',
    created_at    timestamptz not null default now(),
    unique (user_id, month_start)
);

-- 3. The breakdown — weekly milestones + daily steps ────────────────────────
create table if not exists public.monthly_mission_steps (
    id                 uuid primary key default gen_random_uuid(),
    monthly_mission_id uuid not null references public.monthly_missions (id) on delete cascade,
    user_id            uuid not null references auth.users (id) on delete cascade,
    cadence            text not null check (cadence in ('daily', 'weekly')),
    week_index         int not null,            -- 0..3
    due_date           date,                    -- set for daily steps only
    title              text not null,
    detail             text,
    estimate_label     text,
    sort_order         int not null default 0,
    done               boolean not null default false,
    completed_at       timestamptz,
    created_at         timestamptz not null default now()
);

create index if not exists monthly_mission_steps_user_idx
    on public.monthly_mission_steps (user_id, cadence, due_date);
create index if not exists monthly_mission_steps_mission_idx
    on public.monthly_mission_steps (monthly_mission_id);

-- 4. RLS ─────────────────────────────────────────────────────────────────────
alter table public.monthly_missions      enable row level security;
alter table public.monthly_mission_steps enable row level security;

create policy monthly_missions_read_own on public.monthly_missions
    for select using (auth.uid() = user_id);

create policy monthly_mission_steps_read_own on public.monthly_mission_steps
    for select using (auth.uid() = user_id);

-- Users tick their own steps off; nothing else is user-writable.
create policy monthly_mission_steps_update_own on public.monthly_mission_steps
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Generator ───────────────────────────────────────────────────────────────
create or replace function public.ensure_monthly_mission(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_month_start date := date_trunc('month', current_date)::date;
    v_month_end   date := (date_trunc('month', current_date)
                           + interval '1 month - 1 day')::date;
    v_focus    text;
    v_goal     text;
    v_weeks    text[];
    v_estimate text;
    v_mid      uuid;
    d          date;
    w          int;
begin
    if p_user is null then
        return;
    end if;

    -- Idempotent: one mission per user per month.
    if exists (
        select 1 from public.monthly_missions
        where user_id = p_user and month_start = v_month_start
    ) then
        return;
    end if;

    -- Top focus area (deterministic; fall back to craft).
    select focus_area_id into v_focus
    from public.user_focus_areas
    where user_id = p_user
    order by created_at, focus_area_id
    limit 1;
    v_focus := coalesce(v_focus, 'craft');

    -- Daily time estimate from the onboarding time budget.
    select coalesce(time_budget_label, '10 minutes')
    into v_estimate
    from public.profiles
    where user_id = p_user;
    v_estimate := coalesce(v_estimate, '10 minutes');

    -- Focus-area template: a goal + four weekly milestones.
    case v_focus
        when 'venture' then
            v_goal  := 'Move your venture idea one real step forward.';
            v_weeks := array[
                'Define the problem and who has it',
                'Talk to five potential users',
                'Sketch the smallest version that helps',
                'Put it in front of someone and learn'];
        when 'mind' then
            v_goal  := 'Build one habit that steadies your mind and body.';
            v_weeks := array[
                'Choose one keystone habit',
                'Anchor it to a daily cue',
                'Hold the streak through resistance',
                'Reflect and lock it in'];
        when 'people' then
            v_goal  := 'Deepen your circle and show up for others.';
            v_weeks := array[
                'List the people who matter',
                'Reach out and reconnect',
                'Give without keeping score',
                'Plan something together'];
        when 'money' then
            v_goal  := 'Get one step closer to financial clarity.';
            v_weeks := array[
                'Map where your money goes',
                'Cut one leak, name one goal',
                'Set up a simple system',
                'Review and adjust'];
        when 'learn' then
            v_goal  := 'Go deep on one topic worth knowing.';
            v_weeks := array[
                'Choose your topic and source',
                'Study a little every day',
                'Teach it back in your own words',
                'Apply it to something real'];
        else  -- craft
            v_goal  := 'Level up one craft skill this month.';
            v_weeks := array[
                'Pick your skill and set a clear target',
                'Practice the fundamentals daily',
                'Build one small project with it',
                'Ship it and gather feedback'];
    end case;

    insert into public.monthly_missions
        (user_id, month_start, goal_title, focus_area_id, generated_by)
    values (p_user, v_month_start, v_goal, v_focus, 'template')
    returning id into v_mid;

    -- Four weekly milestones.
    for w in 0..3 loop
        insert into public.monthly_mission_steps
            (monthly_mission_id, user_id, cadence, week_index, due_date,
             title, detail, estimate_label, sort_order)
        values (v_mid, p_user, 'weekly', w, null,
                v_weeks[w + 1],
                'Your focus for week ' || (w + 1) || '.',
                'This week', w);
    end loop;

    -- One daily step per calendar day, pointing at that week's milestone.
    d := v_month_start;
    while d <= v_month_end loop
        w := least(3, ((d - v_month_start) / 7)::int);
        insert into public.monthly_mission_steps
            (monthly_mission_id, user_id, cadence, week_index, due_date,
             title, detail, estimate_label, sort_order)
        values (v_mid, p_user, 'daily', w, d,
                v_weeks[w + 1],
                'A small step today toward this week''s focus.',
                v_estimate, (d - v_month_start));
        d := d + 1;
    end loop;
end;
$$;

revoke all on function public.ensure_monthly_mission(uuid) from public;
grant execute on function public.ensure_monthly_mission(uuid) to authenticated;

-- Backfill / cron helper: ensure every onboarded user has this month's mission.
create or replace function public.ensure_all_monthly_missions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    r record;
begin
    for r in
        select user_id from public.profiles where onboarded_at is not null
    loop
        perform public.ensure_monthly_mission(r.user_id);
    end loop;
end;
$$;

-- 6. Monthly cron — 05:00 UTC on the 1st. Idempotent re-registration.
do $$
begin
    if exists (select 1 from cron.job where jobname = 'monthly-missions') then
        perform cron.unschedule('monthly-missions');
    end if;
end $$;

select cron.schedule(
    'monthly-missions',
    '0 5 1 * *',
    $$select public.ensure_all_monthly_missions()$$
);

-- Seed for existing users right now.
select public.ensure_all_monthly_missions();
