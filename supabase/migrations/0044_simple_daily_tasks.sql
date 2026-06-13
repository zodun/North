-- Make daily tasks read clearly. Previously every daily step reused the weekly
-- milestone as its title ("Practice the fundamentals daily"), shown right under
-- a "Week N · <same milestone>" line — redundant and vague. Now each week has a
-- short, concrete daily action distinct from the milestone, so today's task is
-- one plain thing to do toward the goal.
--
-- 1. Redefine ensure_monthly_mission to title daily steps from a per-week
--    daily-action template (weekly milestones unchanged).
-- 2. Backfill existing daily steps so the current month reads clearly too.

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
    v_daily    text[];
    v_estimate text;
    v_mid      uuid;
    d          date;
    w          int;
begin
    if p_user is null then
        return;
    end if;

    if exists (
        select 1 from public.monthly_missions
        where user_id = p_user and month_start = v_month_start
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
    -- (the simple "what to do today" for that week).
    case v_focus
        when 'venture' then
            v_goal  := 'Move your venture idea one real step forward.';
            v_weeks := array[
                'Define the problem and who has it',
                'Talk to five potential users',
                'Sketch the smallest version that helps',
                'Put it in front of someone and learn'];
            v_daily := array[
                'Write one sentence: who has this problem, and why it hurts.',
                'Reach out to one potential user.',
                'Sketch one piece of the simplest version.',
                'Show it to one person and note what they said.'];
        when 'mind' then
            v_goal  := 'Build one habit that steadies your mind and body.';
            v_weeks := array[
                'Choose one keystone habit',
                'Anchor it to a daily cue',
                'Hold the streak through resistance',
                'Reflect and lock it in'];
            v_daily := array[
                'Name the one habit and when you''ll do it.',
                'Do the habit right after your chosen cue.',
                'Do the habit today, even a tiny version.',
                'Note how it felt and plan to keep it.'];
        when 'people' then
            v_goal  := 'Deepen your circle and show up for others.';
            v_weeks := array[
                'List the people who matter',
                'Reach out and reconnect',
                'Give without keeping score',
                'Plan something together'];
            v_daily := array[
                'Add one person who matters to your list.',
                'Send one message to reconnect.',
                'Do one small thing for someone, no strings.',
                'Suggest a time to meet or do something together.'];
        when 'money' then
            v_goal  := 'Get one step closer to financial clarity.';
            v_weeks := array[
                'Map where your money goes',
                'Cut one leak, name one goal',
                'Set up a simple system',
                'Review and adjust'];
            v_daily := array[
                'Write down one thing you spent on today.',
                'Find one expense to trim, or name your savings goal.',
                'Set up one part of your money system.',
                'Check your numbers and adjust one thing.'];
        when 'learn' then
            v_goal  := 'Go deep on one topic worth knowing.';
            v_weeks := array[
                'Choose your topic and source',
                'Study a little every day',
                'Teach it back in your own words',
                'Apply it to something real'];
            v_daily := array[
                'Pick your topic and one source to learn from.',
                'Study for 15 minutes and note one takeaway.',
                'Explain today''s idea in your own words.',
                'Use what you learned on something real.'];
        else  -- craft
            v_goal  := 'Level up one craft skill this month.';
            v_weeks := array[
                'Pick your skill and set a clear target',
                'Practice the fundamentals daily',
                'Build one small project with it',
                'Ship it and gather feedback'];
            v_daily := array[
                'Write down the one skill and where you want it by month-end.',
                'Practice one fundamental for 15 minutes.',
                'Work on your small project for 20 minutes.',
                'Share your work with one person and note feedback.'];
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

    -- One daily step per calendar day, titled with that week's daily action.
    d := v_month_start;
    while d <= v_month_end loop
        w := least(3, ((d - v_month_start) / 7)::int);
        insert into public.monthly_mission_steps
            (monthly_mission_id, user_id, cadence, week_index, due_date,
             title, detail, estimate_label, sort_order)
        values (v_mid, p_user, 'daily', w, d,
                v_daily[w + 1],
                v_weeks[w + 1],
                v_estimate, (d - v_month_start));
        d := d + 1;
    end loop;
end;
$$;

-- Backfill existing daily steps with the new clear titles + milestone detail.
update public.monthly_mission_steps s
set title  = a.action,
    detail = a.milestone
from public.monthly_missions m,
     (values
        ('craft',0,'Write down the one skill and where you want it by month-end.','Pick your skill and set a clear target'),
        ('craft',1,'Practice one fundamental for 15 minutes.','Practice the fundamentals daily'),
        ('craft',2,'Work on your small project for 20 minutes.','Build one small project with it'),
        ('craft',3,'Share your work with one person and note feedback.','Ship it and gather feedback'),
        ('venture',0,'Write one sentence: who has this problem, and why it hurts.','Define the problem and who has it'),
        ('venture',1,'Reach out to one potential user.','Talk to five potential users'),
        ('venture',2,'Sketch one piece of the simplest version.','Sketch the smallest version that helps'),
        ('venture',3,'Show it to one person and note what they said.','Put it in front of someone and learn'),
        ('mind',0,'Name the one habit and when you''ll do it.','Choose one keystone habit'),
        ('mind',1,'Do the habit right after your chosen cue.','Anchor it to a daily cue'),
        ('mind',2,'Do the habit today, even a tiny version.','Hold the streak through resistance'),
        ('mind',3,'Note how it felt and plan to keep it.','Reflect and lock it in'),
        ('people',0,'Add one person who matters to your list.','List the people who matter'),
        ('people',1,'Send one message to reconnect.','Reach out and reconnect'),
        ('people',2,'Do one small thing for someone, no strings.','Give without keeping score'),
        ('people',3,'Suggest a time to meet or do something together.','Plan something together'),
        ('money',0,'Write down one thing you spent on today.','Map where your money goes'),
        ('money',1,'Find one expense to trim, or name your savings goal.','Cut one leak, name one goal'),
        ('money',2,'Set up one part of your money system.','Set up a simple system'),
        ('money',3,'Check your numbers and adjust one thing.','Review and adjust'),
        ('learn',0,'Pick your topic and one source to learn from.','Choose your topic and source'),
        ('learn',1,'Study for 15 minutes and note one takeaway.','Study a little every day'),
        ('learn',2,'Explain today''s idea in your own words.','Teach it back in your own words'),
        ('learn',3,'Use what you learned on something real.','Apply it to something real')
     ) as a(focus, week_index, action, milestone)
where s.monthly_mission_id = m.id
  and s.cadence = 'daily'
  and m.focus_area_id = a.focus
  and s.week_index = a.week_index;
