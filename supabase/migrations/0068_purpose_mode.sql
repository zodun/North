-- Purpose mode (onboarding identity).
-- One question during onboarding asks whether the user already knows their
-- purpose. It sorts them into two modes that lightly shape the app's tone:
--   builder  : knows the purpose, here to execute toward it
--   explorer : still finding it, here to discover
-- Null means not chosen yet. Shown (and re-selectable) on the Profile page.
alter table public.profiles
	add column if not exists purpose_mode text
		check (purpose_mode in ('explorer', 'builder'));
