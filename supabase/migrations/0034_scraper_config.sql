-- ─────────────────────────────────────────────────────────────────────
-- App-level config table (replaces ALTER DATABASE custom settings).
-- Any service_role query can read/write this — no superuser needed.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.app_config (
    key   text primary key,
    value text not null
);

-- Only service_role can touch this table.
alter table public.app_config enable row level security;

-- Seed the two values the scraper cron needs.
-- Update these after deploying via the Table Editor or SQL editor.
insert into public.app_config (key, value) values
    ('functions_url',  'https://chcliaetofwjylltcgfv.supabase.co/functions/v1'),
    ('scrape_secret',  'north-scrape-2026')
on conflict (key) do update set value = excluded.value;

-- Rewrite the cron trigger to read from the table instead of current_setting.
create or replace function public.trigger_scrape_opportunities_job()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    functions_url  text;
    trigger_secret text;
begin
    select value into functions_url  from public.app_config where key = 'functions_url';
    select value into trigger_secret from public.app_config where key = 'scrape_secret';

    if functions_url is null or trigger_secret is null then
        raise notice 'scrape-opportunities trigger skipped: app_config rows missing';
        return;
    end if;

    perform net.http_post(
        url     := functions_url || '/scrape-opportunities',
        headers := jsonb_build_object(
            'content-type',     'application/json',
            'x-trigger-secret', trigger_secret
        ),
        body    := '{}'::jsonb,
        timeout_milliseconds := 120000
    );
end;
$$;
