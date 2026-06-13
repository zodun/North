-- Onboarding: capture which *kinds* of opportunities a user wants surfaced,
-- and make that preference matchable against scraped rows.
--
-- 1. profiles.preferred_opportunity_categories — category ids the user picked
--    in onboarding (subset of public.opportunity_categories.id).
-- 2. Backfill category_id on scraped opportunities. The scraper computed a
--    category but never stored it, so every scraped row has category_id = null
--    and could never match a category preference. This mirrors the
--    inferCategory() priority in supabase/functions/scrape-opportunities.

-- 1. Preference column ──────────────────────────────────────────────────────
alter table public.profiles
    add column if not exists preferred_opportunity_categories text[]
        not null default '{}';

-- 2. Backfill category_id for scraped rows lacking one ──────────────────────
update public.opportunities o
set category_id = case
    when t ~* '(scholarship|bursary|award|prize)'                       then 'scholarship'
    when t ~* '(fellowship|traineeship|placement)'                      then 'internship'
    when t ~* 'internship'                                              then 'internship'
    when t ~* '(accelerator|incubator)'                                 then 'accelerator'
    when t ~* '(grant|funding|fund)'                                    then 'grant'
    when t ~* '(conference|summit|hackathon|competition|contest|bootcamp)' then 'event'
    when t ~* '(community|network|membership)'                          then 'community'
    when t ~* '(\mjob\M|career|position|vacancy|hiring|employ)'         then 'job'
    else 'grant'
end
from (
    select id, lower(coalesce(title, '') || ' ' || coalesce(why, '')) as t
    from public.opportunities
    where source is not null and category_id is null
) as src
where o.id = src.id;
