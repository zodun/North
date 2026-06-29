-- Rolling 4-week mission cycles (anchored to the start date, not the calendar).
--
-- Before: a mission was pinned to the calendar month (month_start =
-- date_trunc('month', current_date), one daily step per calendar day, week_index
-- by calendar week). Setting or first opening a goal late in the month dropped
-- the user onto Week 4 with almost no runway, and everything reset on the 1st.
--
-- After: `month_start` is reinterpreted as the cycle ANCHOR — the day the mission
-- begins. ensure_monthly_mission seeds a real 28-day (4 x 7) cycle from that day,
-- week_index = floor((d - anchor) / 7). A new cycle is created only when the user
-- has no ACTIVE one (anchor within the last 27 days), so each user rolls on their
-- own cadence instead of the calendar.
--
-- Template copy (goal / weekly milestones / daily actions) is unchanged from
-- 0067. The Signal score (0041) already keys off rolling due_date windows, not
-- the calendar month, so it is unaffected. The companion plan-month edge function
-- (custom goals) is updated separately to seed the same 28-day window.
--
-- Transition: existing calendar missions have an anchor (June 1, etc.) older than
-- 27 days, so they count as expired; the seed call at the end of this migration
-- gives every onboarded user a fresh cycle starting today (Week 1). Old rows are
-- left in place, just superseded by the newer anchor the Mission page reads.

create or replace function public.ensure_monthly_mission(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_anchor   date := current_date;   -- a new cycle starts today
    v_focus    text;
    v_goal     text;
    v_weeks    text[];
    v_daily    text[];
    v_estimate text;
    v_mid      uuid;
    d          date;
    w          int;
begin
    if p_user is null then
        return;
    end if;

    -- Idempotent: skip if the user already has an ACTIVE cycle — one whose anchor
    -- is within the last 27 days (so the 28-day window [anchor, anchor+27] still
    -- covers today). Only when none is active do we start a fresh cycle.
    if exists (
        select 1 from public.monthly_missions
        where user_id = p_user
          and month_start >= current_date - 27
    ) then
        return;
    end if;

    select focus_area_id into v_focus
    from public.user_focus_areas
    where user_id = p_user
    order by created_at, focus_area_id
    limit 1;
    v_focus := coalesce(v_focus, 'craft');

    select coalesce(time_budget_label, '10 minutes')
    into v_estimate
    from public.profiles
    where user_id = p_user;
    v_estimate := coalesce(v_estimate, '10 minutes');

    -- goal + 4 weekly milestones (the "what to reach") + 4 daily actions
    -- (the coach's "do this today" for that week). Unchanged from 0067.
    case v_focus
        when 'venture' then
            v_goal  := 'Move your venture idea one real step forward.';
            v_weeks := array[
                'Define the problem and who has it',
                'Talk with five people who have it',
                'Sketch the smallest version that helps',
                'Put it in front of someone and learn'];
            v_daily := array[
                'Write one clear sentence naming who has this problem and why it hurts them.',
                'Message one person who has this problem and ask to hear their story.',
                'Sketch one piece of the simplest version on paper or your screen.',
                'Show your sketch to one person and write down exactly what they said.'];
        when 'mind' then
            v_goal  := 'Build one habit that steadies your mind and body.';
            v_weeks := array[
                'Choose one keystone habit',
                'Anchor it to a daily cue',
                'Hold it through the hard days',
                'Reflect and lock it in'];
            v_daily := array[
                'Write down the one habit you''ll build and the exact time you''ll do it each day.',
                'Do the habit right after your chosen cue, then check it off.',
                'Do the habit today in any size, even a two minute version counts.',
                'Write one line on how the habit felt and how you''ll keep it going.'];
        when 'people' then
            v_goal  := 'Deepen your circle and show up for others.';
            v_weeks := array[
                'List the people who matter',
                'Reach out and reconnect',
                'Give without keeping score',
                'Plan something together'];
            v_daily := array[
                'Write down one person who matters to you and why you want to stay close.',
                'Send one real message to someone you''ve been meaning to reach.',
                'Do one small thing for someone today and expect nothing back.',
                'Message someone to pick a time to meet or do something together.'];
        when 'money' then
            v_goal  := 'Get one step closer to financial clarity.';
            v_weeks := array[
                'Map where your money goes',
                'Cut one leak and set one goal',
                'Set up a simple system',
                'Review and adjust'];
            v_daily := array[
                'Write down everything you spent money on today and add up the total.',
                'Find one expense to cut this month, or write a savings goal with a real number.',
                'Set up one part of your money system, like a budget, an account, or an auto transfer.',
                'Check your spending against your plan and change one thing for next week.'];
        when 'learn' then
            v_goal  := 'Go deep on one topic worth knowing.';
            v_weeks := array[
                'Choose your topic and a source',
                'Study a little every day',
                'Teach it in your own words',
                'Apply it to something real'];
            v_daily := array[
                'Pick the one topic you''ll learn and save one source to start from.',
                'Study for 15 minutes and write down the single idea worth keeping.',
                'Explain today''s idea in your own words, out loud or in writing.',
                'Use one thing you learned on a real task and note how it went.'];
        else  -- craft
            v_goal  := 'Level up one craft skill this month.';
            v_weeks := array[
                'Pick one skill and set a clear target',
                'Practice the fundamentals every day',
                'Build one small project with it',
                'Ship it and gather feedback'];
            v_daily := array[
                'Write down the one skill you''ll grow and exactly where you want it by the end of the month.',
                'Practice one fundamental for 15 minutes, then note the single thing that got better.',
                'Spend 20 minutes on your small project and save whatever you finish today.',
                'Show your work to one person and write down the feedback they give you.'];
    end case;

    -- month_start now stores the cycle ANCHOR (start date), not a calendar month.
    insert into public.monthly_missions
        (user_id, month_start, goal_title, focus_area_id, generated_by)
    values (p_user, v_anchor, v_goal, v_focus, 'template')
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

    -- One daily step for each of the 28 days in the cycle, titled with that
    -- week's daily action. week_index = floor(offset / 7) → exactly weeks 0..3.
    d := v_anchor;
    while d <= v_anchor + 27 loop
        w := least(3, ((d - v_anchor) / 7)::int);
        insert into public.monthly_mission_steps
            (monthly_mission_id, user_id, cadence, week_index, due_date,
             title, detail, estimate_label, sort_order)
        values (v_mid, p_user, 'daily', w, d,
                v_daily[w + 1],
                v_weeks[w + 1],
                v_estimate, (d - v_anchor));
        d := d + 1;
    end loop;
end;
$$;

-- The cron must run DAILY now: cycles end on each user's own 28-day cadence, so a
-- finished cycle should roll into a fresh one the next morning even if the user
-- doesn't open the app. ensure_monthly_mission is a no-op while a cycle is active,
-- so a daily sweep is cheap and idempotent. (ensure_all_monthly_missions and its
-- per-user loop are unchanged.)
do $$
begin
    if exists (select 1 from cron.job where jobname = 'monthly-missions') then
        perform cron.unschedule('monthly-missions');
    end if;
end $$;

select cron.schedule(
    'monthly-missions',
    '0 5 * * *',
    $$select public.ensure_all_monthly_missions()$$
);

-- Transition every onboarded user onto a fresh rolling cycle starting today.
-- Their old calendar mission's anchor is > 27 days back, so it reads as expired
-- and a new Week-1 cycle is created now.
select public.ensure_all_monthly_missions();
