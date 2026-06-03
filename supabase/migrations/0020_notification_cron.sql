-- ─────────────────────────────────────────────────────────────────────
-- NOTIF-01: Notification cron triggers.
--
-- Two jobs per day:
--   morning  13:00 UTC = 09:00 AST — mission-ready reminder for everyone
--   evening  00:00 UTC = 20:00 AST — gentle nudge for users with 0 tasks done
--
-- Neither message uses loss-framing or urgency copy per DEC-05.
--
-- Setup (operator, one-off per environment):
--   supabase secrets set NOTIF_TRIGGER_SECRET=$(openssl rand -hex 32)
--   supabase db remote exec \
--     "alter database postgres set app.notif_trigger_secret = '<same value>'"
--   supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='{ ... }'
--   supabase secrets set APNS_TEAM_ID=XXXXXXXXXX
--   supabase secrets set APNS_KEY_ID=XXXXXXXXXX
--   supabase secrets set APNS_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----...'
--   supabase secrets set APNS_BUNDLE_ID=com.north.app
--   supabase functions deploy send-notifications
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.trigger_notification_job(notif_type text)
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
    trigger_secret := current_setting('app.notif_trigger_secret', true);

    if functions_url is null or trigger_secret is null then
        raise notice
            'send-notifications (%) skipped: app.functions_url or app.notif_trigger_secret not set',
            notif_type;
        return;
    end if;

    perform net.http_post(
        url     := functions_url || '/send-notifications',
        headers := jsonb_build_object(
            'content-type',     'application/json',
            'x-trigger-secret', trigger_secret
        ),
        body               := jsonb_build_object('type', notif_type),
        timeout_milliseconds := 60000
    );
end;
$$;

-- Morning reminder: 13:00 UTC = 09:00 AST. Idempotent re-registration.
do $$
begin
    if exists (select 1 from cron.job where jobname = 'notif-morning') then
        perform cron.unschedule('notif-morning');
    end if;
end $$;

select cron.schedule(
    'notif-morning',
    '0 13 * * *',
    $$select public.trigger_notification_job('morning')$$
);

-- Evening nudge: 00:00 UTC = 20:00 AST. Only users with 0 tasks done.
do $$
begin
    if exists (select 1 from cron.job where jobname = 'notif-evening') then
        perform cron.unschedule('notif-evening');
    end if;
end $$;

select cron.schedule(
    'notif-evening',
    '0 0 * * *',
    $$select public.trigger_notification_job('evening')$$
);
