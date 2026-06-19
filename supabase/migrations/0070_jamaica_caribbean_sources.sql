-- ── 0070: Jamaica & Caribbean opportunity sources ──────────────────────────
--
-- 1. Add `region` to opportunities so Jamaica/Caribbean items can be surfaced
--    first for users from those countries.
-- 2. Add `scrape_type` + `region` to scrape_sources so the edge function can
--    route HTML sources separately from RSS sources.
-- 3. Seed verified Jamaica/Caribbean RSS feeds.
-- 4. Seed MOF Jamaica as an HTML source (no RSS; the edge function scrapes
--    their scholarship/grants pages directly).

-- ── opportunities.region ────────────────────────────────────────────────────

alter table public.opportunities
    add column if not exists region text;

create index if not exists opportunities_region_idx
    on public.opportunities (region)
    where region is not null;

-- ── scrape_sources additions ─────────────────────────────────────────────────

alter table public.scrape_sources
    add column if not exists scrape_type text not null default 'rss',
    add column if not exists region      text;

-- ── Jamaica / Caribbean RSS feeds ───────────────────────────────────────────
-- All verified to return items with NorthApp/1.0 UA as of 2026-06-19.

insert into public.scrape_sources (id, name, feed_url, scrape_type, region) values
    ('jis-jamaica',
     'Jamaica Information Service',
     'https://jis.gov.jm/feed/',
     'rss', 'jamaica'),

    ('heart-trust',
     'HEART/NSTA Trust Jamaica',
     'https://heartnsatrust.org/feed/',
     'rss', 'jamaica'),

    ('dbj-jamaica',
     'Development Bank of Jamaica',
     'https://dbj.org.jm/feed/',
     'rss', 'jamaica'),

    ('jampro',
     'JAMPRO — Trade & Invest',
     'https://jampro.com/feed/',
     'rss', 'jamaica'),

    ('caribbean-export',
     'Caribbean Export Development Agency',
     'https://carib-export.com/feed/',
     'rss', 'caribbean'),

    ('ofcy',
     'Opportunities for Caribbean Youth',
     'https://opportunities-for-caribbean-youth.org/feed',
     'rss', 'caribbean'),

    ('cdb-news',
     'Caribbean Development Bank',
     'https://www.caribank.org/rss',
     'rss', 'caribbean')
on conflict (id) do update set
    name        = excluded.name,
    feed_url    = excluded.feed_url,
    scrape_type = excluded.scrape_type,
    region      = excluded.region;

-- ── MOF Jamaica (HTML source) ────────────────────────────────────────────────
-- The Ministry of Finance Jamaica publishes GOJ scholarships, bursaries, and
-- grant programmes on their website but has no RSS feed. The edge function
-- scrapes their scholarship and news pages directly.

insert into public.scrape_sources (id, name, feed_url, scrape_type, region) values
    ('mof-jamaica',
     'Ministry of Finance Jamaica',
     'https://mof.gov.jm',
     'html', 'jamaica')
on conflict (id) do update set
    name        = excluded.name,
    feed_url    = excluded.feed_url,
    scrape_type = excluded.scrape_type,
    region      = excluded.region;
