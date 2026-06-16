-- Premium free trial (BILLING-02).
-- Everyone gets the premium features (AI personalization of the feed +
-- opportunities) free for a window, then they lock unless the user subscribes.
--
-- trial_ends_at carries the window. Adding the column with a constant-expression
-- default fills existing users with (migration time + 14 days) and stamps each
-- new signup with (their insert time + 14 days) — so current users get a trial
-- from launch and new users get one from sign-up, with no trigger or backfill.
-- Change the interval to change the trial length; set a user's trial_ends_at to
-- the past to end their trial early, or further out to extend it.
alter table public.profiles
    add column if not exists trial_ends_at timestamptz not null
        default (now() + interval '14 days');

-- Entitlement now means: a paying or trialing subscription, OR an unexpired
-- free trial. Mirrored by the TS helper in apps/web/src/lib/entitlement.ts.
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
    )
    or exists (
        select 1 from public.profiles
        where user_id = p_user
          and trial_ends_at > now()
    );
$$;
