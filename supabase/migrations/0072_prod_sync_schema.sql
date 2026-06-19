-- ── 0072: Prod sync — add missing columns + tables ───────────────────────────
-- Production was missing columns added to opportunities in prior migrations,
-- and the scrape_sources, opportunity_categories, user_saved_opportunities
-- tables were never created in prod. This catch-up migration brings prod in
-- line with dev so the scraper edge function can run.

-- 1. Missing columns on opportunities
alter table public.opportunities
  add column if not exists category_id     text,
  add column if not exists source          text,
  add column if not exists source_id       text,
  add column if not exists scraped_at      timestamptz,
  add column if not exists focus_area_tags text[] not null default '{}';

create unique index if not exists opportunities_source_id_uidx
  on public.opportunities (source_id)
  where source_id is not null;

-- 2. RLS on opportunities
alter table public.opportunities enable row level security;

drop policy if exists opportunities_read_published on public.opportunities;
create policy opportunities_read_published on public.opportunities
  for select using (
    license_status = 'cleared'
    and published_at is not null
    and published_at <= now()
  );

drop policy if exists opportunities_admin_write on public.opportunities;
create policy opportunities_admin_write on public.opportunities
  for all using (is_admin()) with check (is_admin());

-- 3. opportunity_categories
create table if not exists public.opportunity_categories (
  id         text primary key,
  label      text not null,
  sort_order integer not null default 0
);

alter table public.opportunity_categories enable row level security;

drop policy if exists opportunity_categories_read_all on public.opportunity_categories;
create policy opportunity_categories_read_all on public.opportunity_categories
  for select using (true);

drop policy if exists opportunity_categories_admin_write on public.opportunity_categories;
create policy opportunity_categories_admin_write on public.opportunity_categories
  for all using (is_admin()) with check (is_admin());

insert into public.opportunity_categories (id, label, sort_order) values
  ('job',              'Jobs',              0),
  ('internship',       'Internships',       1),
  ('scholarship',      'Scholarships',      2),
  ('accelerator',      'Accelerators',      3),
  ('grant',            'Grants',            4),
  ('community',        'Communities',       5),
  ('event',            'Events',            6),
  ('creator-programme','Creator Programmes',7)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

-- 4. scrape_sources
create table if not exists public.scrape_sources (
  id              text primary key,
  name            text not null,
  feed_url        text,
  enabled         boolean not null default true,
  last_scraped_at timestamptz,
  items_added     integer not null default 0,
  scrape_type     text not null default 'rss',
  region          text
);

insert into public.scrape_sources (id, name, feed_url, scrape_type, region) values
  ('opportunity-desk',          'Opportunity Desk',                    'https://opportunitydesk.org/feed/',                       'rss',  null),
  ('youthop',                   'Opportunities for Youth',             'https://opportunitiesforyouth.org/feed/',                 'rss',  null),
  ('afterschool-africa',        'Opportunities for Young Kenyans',     'https://www.opportunitiesforyoungkenyans.co.ke/feed/',     'rss',  null),
  ('opportunities-for-africans','Opportunities for Africans',          'https://www.opportunitiesforafricans.com/feed/',          'rss',  null),
  ('world-scholarship-forum',   'World Scholarship Forum',             'https://worldscholarshipforum.com/feed/',                 'rss',  null),
  ('scholars4dev',              'Mladiinfo',                           'https://mladiinfo.eu/feed/',                              'rss',  null),
  ('youth4work',                'Opportunities for Young Africans',    'https://oyaop.com/feed/',                                 'rss',  null),
  ('jis-jamaica',               'Jamaica Information Service',         'https://jis.gov.jm/feed/',                                'rss',  'jamaica'),
  ('heart-trust',               'HEART/NSTA Trust Jamaica',            'https://heartnsatrust.org/feed/',                         'rss',  'jamaica'),
  ('dbj-jamaica',               'Development Bank of Jamaica',         'https://dbj.org.jm/feed/',                                'rss',  'jamaica'),
  ('jampro',                    'JAMPRO — Trade & Invest',             'https://jampro.com/feed/',                                'rss',  'jamaica'),
  ('caribbean-export',          'Caribbean Export Development Agency', 'https://carib-export.com/feed/',                          'rss',  'caribbean'),
  ('ofcy',                      'Opportunities for Caribbean Youth',   'https://opportunities-for-caribbean-youth.org/feed',      'rss',  'caribbean'),
  ('cdb-news',                  'Caribbean Development Bank',          'https://www.caribank.org/rss',                            'rss',  'caribbean'),
  ('mof-jamaica',               'Ministry of Finance Jamaica',         'https://mof.gov.jm',                                      'html', 'jamaica')
on conflict (id) do update set
  name        = excluded.name,
  feed_url    = excluded.feed_url,
  scrape_type = excluded.scrape_type,
  region      = excluded.region;

-- 5. user_saved_opportunities
create table if not exists public.user_saved_opportunities (
  user_id        uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  saved_at       timestamptz not null default now(),
  applied        boolean not null default false,
  applied_at     timestamptz,
  primary key (user_id, opportunity_id)
);

alter table public.user_saved_opportunities enable row level security;

drop policy if exists user_saved_opportunities_self on public.user_saved_opportunities;
create policy user_saved_opportunities_self on public.user_saved_opportunities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
