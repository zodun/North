-- Telegram reminders (NOTIF-03)
-- Link a Telegram chat to the account via a one-time deep-link token, then
-- deliver the daily mission reminder over the bot. Rides the existing
-- send-notifications cron as an extra channel (free, no per-message cost).
--
-- (The earlier whatsapp_* columns from 0058 are left in place but unused — this
-- supersedes that channel.)

alter table public.profiles
	add column if not exists telegram_chat_id text,
	add column if not exists telegram_opt_in boolean not null default false;

-- One-time tokens backing the t.me/<bot>?start=<token> deep link. The webhook
-- reads the token to learn which North user pressed Start. Written/read only by
-- the Edge Functions (service role); RLS on with no policies, so clients can't
-- read or forge a token.
create table if not exists public.telegram_link_tokens (
	token      text primary key,
	user_id    uuid not null references auth.users(id) on delete cascade,
	expires_at timestamptz not null,
	created_at timestamptz not null default now()
);

alter table public.telegram_link_tokens enable row level security;
-- Intentionally no policies: only the service role may read/write tokens.
