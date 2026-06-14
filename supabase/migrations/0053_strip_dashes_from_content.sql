-- Strip em dashes and en dashes from all user-facing content.
--
-- Product copy rule: no em dashes or en dashes anywhere users can see. Seeded
-- content, AI-generated mission steps, and scraped opportunities all carried
-- them. This normalizes existing rows: a dash between two numbers becomes " to "
-- (so "10–20 minutes" reads "10 to 20 minutes"); any other dash becomes a comma.
--
-- Idempotent: the WHERE guards skip already-clean rows, so re-running (e.g. after
-- `supabase db reset`, where this runs after the seed migrations) is a no-op once
-- the data is clean. pg_temp keeps the helper session-local.

create function pg_temp.strip_dashes(s text) returns text
language sql immutable as $$
  select case
    when s is null then null
    else regexp_replace(
           regexp_replace(s, '(\d)\s*[–—]\s*(\d)', '\1 to \2', 'g'),
           '\s*[–—]\s*', ', ', 'g')
  end
$$;

update public.content_items set
  eyebrow = pg_temp.strip_dashes(eyebrow),
  title   = pg_temp.strip_dashes(title),
  body    = pg_temp.strip_dashes(body),
  source  = pg_temp.strip_dashes(source)
where eyebrow ~ '[–—]' or title ~ '[–—]' or body ~ '[–—]' or source ~ '[–—]';

update public.opportunities set
  title            = pg_temp.strip_dashes(title),
  org              = pg_temp.strip_dashes(org),
  opportunity_type = pg_temp.strip_dashes(opportunity_type),
  location         = pg_temp.strip_dashes(location),
  deadline         = pg_temp.strip_dashes(deadline),
  why              = pg_temp.strip_dashes(why),
  attribution_text = pg_temp.strip_dashes(attribution_text)
where title ~ '[–—]' or org ~ '[–—]' or opportunity_type ~ '[–—]'
   or location ~ '[–—]' or deadline ~ '[–—]' or why ~ '[–—]'
   or attribution_text ~ '[–—]';

update public.peer_stories set
  name        = pg_temp.strip_dashes(name),
  who         = pg_temp.strip_dashes(who),
  quote       = pg_temp.strip_dashes(quote),
  outcome     = pg_temp.strip_dashes(outcome),
  source_name = pg_temp.strip_dashes(source_name)
where name ~ '[–—]' or who ~ '[–—]' or quote ~ '[–—]'
   or outcome ~ '[–—]' or source_name ~ '[–—]';

update public.monthly_mission_steps set
  title          = pg_temp.strip_dashes(title),
  detail         = pg_temp.strip_dashes(detail),
  estimate_label = pg_temp.strip_dashes(estimate_label)
where title ~ '[–—]' or detail ~ '[–—]' or estimate_label ~ '[–—]';

update public.monthly_missions set
  goal_title  = pg_temp.strip_dashes(goal_title),
  goal_intent = pg_temp.strip_dashes(goal_intent)
where goal_title ~ '[–—]' or goal_intent ~ '[–—]';

-- Generated-text tables (not seeded, so empty after a reset; this cleans any
-- existing AI output). jsonb is normalized via its text form: only string
-- values contain dashes, so the replacements never touch JSON structure.
update public.signal_summaries set
  summary_text = pg_temp.strip_dashes(summary_text),
  callouts = regexp_replace(
               regexp_replace(callouts::text, '(\d)\s*[–—]\s*(\d)', '\1 to \2', 'g'),
               '\s*[–—]\s*', ', ', 'g')::jsonb
where summary_text ~ '[–—]' or callouts::text ~ '[–—]';

update public.user_reflections set
  analysis = regexp_replace(
               regexp_replace(analysis::text, '(\d)\s*[–—]\s*(\d)', '\1 to \2', 'g'),
               '\s*[–—]\s*', ', ', 'g')::jsonb
where analysis::text ~ '[–—]';
