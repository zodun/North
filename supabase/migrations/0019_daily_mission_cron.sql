-- ─────────────────────────────────────────────────────────────────────
-- Daily mission cron trigger (MSN-01 / AI-01).
--
-- Fires the daily-mission Edge Function at 08:00 UTC = 04:00 AST daily.
-- At 08:00 UTC, ast_day(now()) returns today's AST date, so missions
-- are ready before users wake up.
--
-- Setup (operator, one-off per environment) — same pattern as
-- 0006_signal_summary_cron.sql:
--
--   supabase secrets set MISSION_TRIGGER_SECRET=$(openssl rand -hex 32)
--   supabase db remote exec \
--     "alter database postgres set app.mission_trigger_secret = '<same value>'"
--   supabase functions deploy daily-mission
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.trigger_daily_mission_job()
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
    trigger_secret := current_setting('app.mission_trigger_secret', true);

    if functions_url is null or trigger_secret is null then
        raise notice
            'daily-mission trigger skipped: app.functions_url or app.mission_trigger_secret not set';
        return;
    end if;

    perform net.http_post(
        url     := functions_url || '/daily-mission',
        headers := jsonb_build_object(
            'content-type',      'application/json',
            'x-trigger-secret',  trigger_secret
        ),
        body               := '{}'::jsonb,
        timeout_milliseconds := 120000
    );
end;
$$;

-- Daily at 08:00 UTC (= 04:00 AST). Idempotent re-registration.
do $$
begin
    if exists (select 1 from cron.job where jobname = 'daily-mission') then
        perform cron.unschedule('daily-mission');
    end if;
end $$;

select cron.schedule(
    'daily-mission',
    '0 8 * * *',
    $$select public.trigger_daily_mission_job()$$
);
