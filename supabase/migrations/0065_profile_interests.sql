-- Onboarding interests (the "what do you love outside work or study" question).
-- Topical and creative interests (poetry, music, visual art, sport, ...), used to
-- surface non-academic opportunities and personalize the feed. Distinct from the
-- six focus areas (direction) and from preferred_opportunity_categories.
alter table public.profiles
	add column if not exists interests text[] not null default '{}';
