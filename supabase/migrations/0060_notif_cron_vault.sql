-- NOTIF-01: move the cron trigger's config from session GUCs to Supabase Vault.
--
-- The original trigger_notification_job (migration 0020) read app.functions_url
-- and app.notif_trigger_secret via current_setting(). On hosted Supabase the
-- `postgres` role can't set those parameters (ALTER DATABASE/ROLE both raise
-- "permission denied to set parameter"), so the job always short-circuited.
--
-- Vault is the supported store for pg_cron/pg_net secrets and is writable from
-- the SQL editor. Operator setup (once per environment):
--   select vault.create_secret(
--     'https://<project-ref>.supabase.co/functions/v1', 'functions_url');
--   select vault.create_secret('<NOTIF_TRIGGER_SECRET>', 'notif_trigger_secret');
-- Re-running? Use vault.update_secret(<id>, '<value>') instead — names are unique.
--
-- The cron jobs themselves (notif-morning / notif-evening) are unchanged from
-- 0020; they call this function, so replacing it is enough.

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
    select decrypted_secret into functions_url
        from vault.decrypted_secrets where name = 'functions_url';
    select decrypted_secret into trigger_secret
        from vault.decrypted_secrets where name = 'notif_trigger_secret';

    if functions_url is null or trigger_secret is null then
        raise notice
            'send-notifications (%) skipped: vault secrets functions_url / notif_trigger_secret not set',
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
