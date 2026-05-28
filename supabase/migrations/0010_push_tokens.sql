-- North · push token registry (operating-doc DEC-21; tracker INFRA-08)
-- One row per user · stores the device's bare FCM/APNs push token
-- (Notifications.getDevicePushTokenAsync on native). Server-side push
-- send is M2/M3 work — this migration only lands the storage so the
-- native client can register the token at sign-in.

create table if not exists public.push_tokens (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    token      text not null,
    platform   text not null check (platform in ('ios', 'android')),
    updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

-- Own-rows read + write. Server-side push send under the service role
-- bypasses RLS by design.
create policy push_tokens_self on public.push_tokens
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
