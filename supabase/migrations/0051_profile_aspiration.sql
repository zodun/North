-- Free-text aspiration captured during onboarding ("what you most want to make
-- real this year"). Used to personalise the "Chosen with you in mind" copy on
-- the For You feed. Nullable + optional — the question can be skipped.
alter table public.profiles
	add column if not exists aspiration text;
