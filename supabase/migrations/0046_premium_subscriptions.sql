-- ─────────────────────────────────────────────────────────────────────
-- Premium subscriptions (BILLING-01)
--
-- Entitlement state for the premium tier, kept in sync by the Polar webhook
-- (apps/web .../api/billing/webhook). One row per user. The webhook writes
-- with the service role; clients may only read their own row. Premium-gated
-- features (AI personalization of the feed + opportunities) check is_premium().
--
-- Status values mirror Polar subscription lifecycle:
--   active     — paid and current
--   trialing   — in a trial that still grants access
--   canceled   — set to not renew, but still active until current_period_end
--   revoked    — access ended (refund, dunning, immediate cancel)
--   inactive   — never subscribed / fully lapsed
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
    user_id              uuid primary key references auth.users (id) on delete cascade,
    polar_customer_id    text,
    polar_subscription_id text,
    product_id           text,
    status               text not null default 'inactive'
        check (status in ('active', 'trialing', 'canceled', 'revoked', 'inactive')),
    current_period_end   timestamptz,
    cancel_at_period_end boolean not null default false,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx
    on public.subscriptions (polar_customer_id);

alter table public.subscriptions enable row level security;

-- Owner-read only. Writes happen exclusively via the service role in the
-- Polar webhook, so there is deliberately no insert/update/delete policy.
create policy subscriptions_read_own on public.subscriptions
    for select using (auth.uid() = user_id);

-- Is this user entitled to premium right now? Canceled-but-not-yet-expired
-- still counts (they keep access until current_period_end).
create or replace function public.is_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.subscriptions
        where user_id = p_user
          and status in ('active', 'trialing', 'canceled')
          and (current_period_end is null or current_period_end > now())
    );
$$;

revoke all on function public.is_premium(uuid) from public;
grant execute on function public.is_premium(uuid) to authenticated;
