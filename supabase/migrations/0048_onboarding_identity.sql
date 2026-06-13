-- Onboarding: capture who the user *is*, so the feed and opportunities can be
-- scoped to relevance/eligibility — not just to what they want.
--
-- North is built for young professionals globally, so the three highest-leverage
-- dimensions are:
--   1. career_stage     — student → graduating → early → mid → founder. Gates
--                         early-career fellowships, grad programmes, "<3 yrs".
--   2. fields           — domain(s) they work in / are moving toward. The single
--                         biggest relevance lever for a global audience.
--   3. country / remote — where they are and how far they can go, so we can
--                         honour work-authorisation and remote-eligibility.
--
-- All consumed by the `personalize` Edge Function (AI-07) alongside the existing
-- focus areas / intent / goal context. Nullable so existing rows stay valid.

alter table public.profiles
    add column if not exists career_stage     text,
    add column if not exists fields           text[]  not null default '{}',
    add column if not exists country          text,
    add column if not exists open_to_remote   boolean not null default false,
    add column if not exists open_to_relocate boolean not null default false;
