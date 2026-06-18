-- Rewrite the template missions to sound like a coach giving the next step, not
-- a report of what's already done. Every daily action now starts with a verb, is
-- doable in one sitting, names something concrete, and has a clear finish point.
-- Weekly milestones stay short verb-first checkpoints. Goal titles (the month's
-- aspiration) are unchanged.
--
-- 1. Redefine ensure_monthly_mission with the rewritten weekly + daily copy.
-- 2. Backfill any existing missions so live months read the same way.

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
    -- (the coach's "do this today" for that week).
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

-- Backfill existing template missions: daily steps get the rewritten action +
-- milestone detail; weekly milestones get the rewritten title. Only touches
-- template missions, so user-authored plans (generated_by = 'manual') keep their
-- own text. Keyed by focus + week, so it is safe to re-run.
with copy(focus, week_index, milestone, action) as (values
    ('craft',0,'Pick one skill and set a clear target','Write down the one skill you''ll grow and exactly where you want it by the end of the month.'),
    ('craft',1,'Practice the fundamentals every day','Practice one fundamental for 15 minutes, then note the single thing that got better.'),
    ('craft',2,'Build one small project with it','Spend 20 minutes on your small project and save whatever you finish today.'),
    ('craft',3,'Ship it and gather feedback','Show your work to one person and write down the feedback they give you.'),
    ('venture',0,'Define the problem and who has it','Write one clear sentence naming who has this problem and why it hurts them.'),
    ('venture',1,'Talk with five people who have it','Message one person who has this problem and ask to hear their story.'),
    ('venture',2,'Sketch the smallest version that helps','Sketch one piece of the simplest version on paper or your screen.'),
    ('venture',3,'Put it in front of someone and learn','Show your sketch to one person and write down exactly what they said.'),
    ('mind',0,'Choose one keystone habit','Write down the one habit you''ll build and the exact time you''ll do it each day.'),
    ('mind',1,'Anchor it to a daily cue','Do the habit right after your chosen cue, then check it off.'),
    ('mind',2,'Hold it through the hard days','Do the habit today in any size, even a two minute version counts.'),
    ('mind',3,'Reflect and lock it in','Write one line on how the habit felt and how you''ll keep it going.'),
    ('people',0,'List the people who matter','Write down one person who matters to you and why you want to stay close.'),
    ('people',1,'Reach out and reconnect','Send one real message to someone you''ve been meaning to reach.'),
    ('people',2,'Give without keeping score','Do one small thing for someone today and expect nothing back.'),
    ('people',3,'Plan something together','Message someone to pick a time to meet or do something together.'),
    ('money',0,'Map where your money goes','Write down everything you spent money on today and add up the total.'),
    ('money',1,'Cut one leak and set one goal','Find one expense to cut this month, or write a savings goal with a real number.'),
    ('money',2,'Set up a simple system','Set up one part of your money system, like a budget, an account, or an auto transfer.'),
    ('money',3,'Review and adjust','Check your spending against your plan and change one thing for next week.'),
    ('learn',0,'Choose your topic and a source','Pick the one topic you''ll learn and save one source to start from.'),
    ('learn',1,'Study a little every day','Study for 15 minutes and write down the single idea worth keeping.'),
    ('learn',2,'Teach it in your own words','Explain today''s idea in your own words, out loud or in writing.'),
    ('learn',3,'Apply it to something real','Use one thing you learned on a real task and note how it went.')
)
update public.monthly_mission_steps s
set title  = case when s.cadence = 'daily' then c.action else c.milestone end,
    detail = case when s.cadence = 'daily' then c.milestone else s.detail end
from public.monthly_missions m, copy c
where s.monthly_mission_id = m.id
  and m.generated_by = 'template'
  and m.focus_area_id = c.focus
  and s.week_index = c.week_index
  and s.cadence in ('daily', 'weekly');
