-- North · fill-article-images · nightly cron trigger
-- Backfills an on-brand cover (lib/article-image cascade) for every shown
-- content_item that has no image, so web AND native always have a thumbnail.
-- Calls the fill-article-images Edge Function via pg_net.
--
-- Setup (operator, one-off per environment):
--   alter database postgres set app.functions_url = 'http://127.0.0.1:54321/functions/v1';
--     -- (or the project's hosted edge functions URL)
--   alter database postgres set app.article_image_trigger_secret = '<random hex>';
--   supabase secrets set ARTICLE_IMAGE_TRIGGER_SECRET=<same value>
--   supabase secrets set APP_BASE_URL=https://<your-app-host>
--   supabase functions deploy fill-article-images

create or replace function public.trigger_fill_article_images_job()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    functions_url  text;
    trigger_secret text;
begin
    functions_url  := current_setting('app.functions_url', true);
    trigger_secret := current_setting('app.article_image_trigger_secret', true);

    if functions_url is null or trigger_secret is null then
        raise notice
            'fill-article-images trigger skipped: app.functions_url or app.article_image_trigger_secret not set';
        return;
    end if;

    perform net.http_post(
        url     := functions_url || '/fill-article-images',
        headers := jsonb_build_object(
            'content-type',      'application/json',
            'x-trigger-secret',  trigger_secret
        ),
        body               := '{}'::jsonb,
        timeout_milliseconds := 120000
    );
end;
$$;

-- Nightly at 03:30 UTC (after curated ingestion settles). Idempotent re-register.
do $$
begin
    if exists (select 1 from cron.job where jobname = 'fill-article-images') then
        perform cron.unschedule('fill-article-images');
    end if;
end $$;

select cron.schedule(
    'fill-article-images',
    '30 3 * * *',
    $$select public.trigger_fill_article_images_job()$$
);
