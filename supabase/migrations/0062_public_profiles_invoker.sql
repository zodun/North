-- Security advisor "Security Definer View" on public.public_profiles.
--
-- public_profiles deliberately exposes a SAFE, cross-user subset of profiles
-- (display name, country, points, focus areas, signal band/score) to signed-in
-- users, while profiles itself stays self-only RLS. The old design did this with
-- a SECURITY DEFINER *view*, which the advisor flags because a definer view
-- silently runs with the creator's privileges and is easy to misuse.
--
-- Fix without changing what's exposed or loosening profiles' RLS: put the
-- privileged cross-user read in an explicit, grant-gated SECURITY DEFINER
-- FUNCTION (the accepted pattern for a deliberate privileged read), and redefine
-- the view as SECURITY INVOKER over it. The view is no longer a definer view, so
-- the finding clears; callers still query public_profiles unchanged.

create or replace function public.get_public_profiles()
returns table (
    user_id         uuid,
    display_name    text,
    country         text,
    community_points integer,
    focus_area_ids  text[],
    signal_band     text,
    signal_score    integer
)
language sql
stable
security definer
set search_path = public
as $$
    select
        p.user_id,
        p.display_name,
        p.country,
        p.community_points,
        (
            select array_agg(ufa.focus_area_id)
            from public.user_focus_areas ufa
            where ufa.user_id = p.user_id
        ) as focus_area_ids,
        (
            select s.band
            from public.signal_scores s
            where s.user_id = p.user_id
            order by s.week_ending desc
            limit 1
        ) as signal_band,
        (
            select s.raw_score
            from public.signal_scores s
            where s.user_id = p.user_id
            order by s.week_ending desc
            limit 1
        ) as signal_score
    from public.profiles p;
$$;

-- Only signed-in users may run it (matches the old view's grant).
revoke all on function public.get_public_profiles() from public, anon;
grant execute on function public.get_public_profiles() to authenticated;

-- Redefine the view as SECURITY INVOKER over the function. Same columns, so
-- every existing public_profiles query keeps working untouched.
create or replace view public.public_profiles
    with (security_invoker = on) as
    select * from public.get_public_profiles();

revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;
