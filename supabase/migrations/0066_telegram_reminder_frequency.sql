-- Telegram reminder frequency (NOTIF-03)
-- Let the user choose how often the daily mission reminder pings Telegram. The
-- send-notifications cron still runs every morning; this just gates whether a
-- given user is included on a given day.
--   daily    : every morning (the existing behaviour, and the default)
--   weekdays : Monday through Friday only
--   weekly   : Mondays only
alter table public.profiles
	add column if not exists telegram_frequency text not null default 'daily'
		check (telegram_frequency in ('daily', 'weekdays', 'weekly'));
