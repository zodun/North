-- ─────────────────────────────────────────────────────────────────────
-- Opportunity scraper infrastructure (OPP-SCRAPE-01)
--
-- 1. Extend public.opportunities with scraping metadata columns.
-- 2. Create public.scrape_sources to track RSS feed state.
-- 3. Register a daily pg_cron trigger to call the scrape-opportunities
--    Edge Function at 06:00 UTC each morning.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Scraping metadata on opportunities.
alter table public.opportunities
    add column if not exists source          text,
    add column if not exists source_id       text,
    add column if not exists scraped_at      timestamptz,
    add column if not exists focus_area_tags text[] not null default '{}';

-- Deduplication: one row per (source, source_id).
create unique index if not exists opportunities_source_id_idx
    on public.opportunities (source, source_id)
    where source_id is not null;

-- Fast lookups for the personalised query.
create index if not exists opportunities_focus_area_tags_idx
    on public.opportunities using gin (focus_area_tags);

-- 2. Scrape sources registry.
create table if not exists public.scrape_sources (
    id              text primary key,
    name            text not null,
    feed_url        text not null,
    enabled         boolean not null default true,
    last_scraped_at timestamptz,
    items_added     int not null default 0
);

-- Seed the global opportunity RSS feeds.
insert into public.scrape_sources (id, name, feed_url) values
    ('opportunity-desk',
     'Opportunity Desk',
     'https://opportunitydesk.org/feed/'),
    ('scholars4dev',
     'Scholars4Dev',
     'https://scholars4dev.com/feed/'),
    ('youthop',
     'Youth Op',
     'https://www.youthop.com/feed'),
    ('afterschool-africa',
     'After School Africa',
     'https://afterschoolafrica.com/feed/'),
    ('world-scholarship-forum',
     'World Scholarship Forum',
     'https://worldscholarshipforum.com/feed/'),
    ('opportunities-for-africans',
     'Opportunities for Africans',
     'https://www.opportunitiesforafricans.com/feed/'),
    ('youth4work',
     'Devex – Jobs & Opportunities',
     'https://www.devex.com/jobs/rss')
on conflict (id) do update
    set name = excluded.name,
        feed_url = excluded.feed_url;

-- 3. Trigger function called by pg_cron.
create or replace function public.trigger_scrape_opportunities_job()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    functions_url   text;
    trigger_secret  text;
begin
    functions_url  := current_setting('app.functions_url',     true);
    trigger_secret := current_setting('app.scrape_secret',     true);

    if functions_url is null or trigger_secret is null then
        raise notice
            'scrape-opportunities trigger skipped: app.functions_url or app.scrape_secret not set';
        return;
    end if;

    perform net.http_post(
        url     := functions_url || '/scrape-opportunities',
        headers := jsonb_build_object(
            'content-type',  'application/json',
            'x-trigger-secret', trigger_secret
        ),
        body    := '{}'::jsonb,
        timeout_milliseconds := 120000
    );
end;
$$;

-- Daily cron: 06:00 UTC. Idempotent re-registration.
do $$
begin
    if exists (select 1 from cron.job where jobname = 'scrape-opportunities-daily') then
        perform cron.unschedule('scrape-opportunities-daily');
    end if;
end $$;

select cron.schedule(
    'scrape-opportunities-daily',
    '0 6 * * *',
    $$select public.trigger_scrape_opportunities_job()$$
);
