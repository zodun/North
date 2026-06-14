-- New onboarding fields powering For You + Opportunities.
--   content_formats: how the user likes to learn (read/watch/listen) → For You
--                    can favor matching card kinds.
--   education_level: highest education completed/in progress → Opportunities can
--                    match scholarship/grant eligibility.
alter table public.profiles
	add column if not exists content_formats text[] not null default '{}',
	add column if not exists education_level text;

comment on column public.profiles.content_formats is
	'Preferred content formats from onboarding (read/watch/listen); used to favor For You card kinds.';
comment on column public.profiles.education_level is
	'Highest education level (completed or in progress) from onboarding; used for Opportunities eligibility matching.';
