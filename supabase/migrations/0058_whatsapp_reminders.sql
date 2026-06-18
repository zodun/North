-- WhatsApp reminders (NOTIF-02)
-- Opt-in phone channel for the daily mission reminder, with OTP verification via
-- the Meta WhatsApp Cloud API. Delivery rides the existing send-notifications
-- cron as a third channel alongside FCM/APNs.

-- Phone + verified opt-in live on the profile.
--   phone                : E.164-ish number the user verified
--   whatsapp_opt_in      : user wants WhatsApp reminders
--   whatsapp_verified_at : set only by the whatsapp-verify Edge Function after a
--                          successful OTP check; the reminder send gates on this,
--                          so an unverified number never receives a message.
alter table public.profiles
	add column if not exists phone text,
	add column if not exists whatsapp_opt_in boolean not null default false,
	add column if not exists whatsapp_verified_at timestamptz;

-- Short-lived one-time codes for verifying a number. Written and read ONLY by the
-- whatsapp-verify Edge Function (service role). RLS is enabled with no policies,
-- so anon/authenticated clients can never read or forge a code.
create table if not exists public.whatsapp_otps (
	user_id    uuid primary key references auth.users(id) on delete cascade,
	phone      text not null,
	code_hash  text not null,
	expires_at timestamptz not null,
	attempts   smallint not null default 0,
	created_at timestamptz not null default now()
);

alter table public.whatsapp_otps enable row level security;
-- Intentionally no policies: service role (which bypasses RLS) is the only writer/reader.
