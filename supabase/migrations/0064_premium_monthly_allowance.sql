-- Premium free tier: monthly usage allowance (BILLING-02). Replaces the 14-day
-- time trial from 0063 with a recurring monthly allowance: free users get up to
-- 10 premium DAYS per calendar month. A "day" is claimed the first time they get
-- the premium experience that day (across the feed or opportunities, deduped so
-- using both in one day costs one). After 10 days in a month, premium locks until
-- the month resets or they subscribe. Paying subscribers stay unlimited.
--
-- To tune the allowance, change the two `10` literals below (keep them equal).

-- The time-trial column is no longer the model.
alter table public.profiles drop column if exists trial_ends_at;

alter table public.profiles
	add column if not exists premium_period text, -- 'YYYY-MM' the counter is for
	add column if not exists premium_uses int not null default 0,
	add column if not exists premium_last_used date; -- last day a credit was spent

-- Read-only entitlement check: does the user have premium available right now?
-- Paid, OR already unlocked today, OR this month's allowance not yet spent.
-- STABLE so it's safe anywhere (RLS, plain checks). Does NOT spend a credit.
create or replace function public.is_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select
		exists (
			select 1 from public.subscriptions
			where user_id = p_user
			  and status in ('active', 'trialing', 'canceled')
			  and (current_period_end is null or current_period_end > now())
		)
		or exists (
			select 1 from public.profiles p
			where p.user_id = p_user
			  and (
				  p.premium_last_used = current_date
				  or p.premium_period is distinct from to_char(current_date, 'YYYY-MM')
				  or p.premium_uses < 10
			  )
		);
$$;

-- Claim today's premium, spending one monthly day-credit the first time it is
-- called each day. Idempotent within a day. Returns whether the caller has
-- premium today. VOLATILE (it writes). The entitlement gate calls this.
create or replace function public.claim_premium_day(p_user uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
	v_today  date := current_date;
	v_month  text := to_char(current_date, 'YYYY-MM');
	v_paid   boolean;
	v_period text;
	v_uses   int;
	v_last   date;
begin
	-- A user may only claim for themselves.
	if p_user is null or p_user is distinct from auth.uid() then
		return false;
	end if;

	select exists (
		select 1 from public.subscriptions
		where user_id = p_user
		  and status in ('active', 'trialing', 'canceled')
		  and (current_period_end is null or current_period_end > now())
	) into v_paid;
	if v_paid then
		return true;
	end if;

	select premium_period, premium_uses, premium_last_used
	  into v_period, v_uses, v_last
	  from public.profiles
	  where user_id = p_user
	  for update;

	if not found then
		return false;
	end if;

	-- Already claimed today: no further spend.
	if v_last = v_today then
		return true;
	end if;

	-- A new month resets the counter.
	if v_period is distinct from v_month then
		v_uses := 0;
	end if;

	if v_uses < 10 then
		update public.profiles
		   set premium_period = v_month,
		       premium_uses = v_uses + 1,
		       premium_last_used = v_today
		 where user_id = p_user;
		return true;
	end if;

	return false;
end;
$$;

revoke all on function public.claim_premium_day(uuid) from public, anon;
grant execute on function public.claim_premium_day(uuid) to authenticated;
