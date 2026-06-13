-- Fix broken Listen (voice) links. Three TED URLs seeded in 0016 return 404:
-- the Matt Walker slug carries a stray "why_", and the Josh Kaufman / Richard
-- Davidson talks are TEDx (not hosted on ted.com/talks). Point them at verified
-- live sources (corrected TED slug + the canonical TEDx YouTube videos) so the
-- Listen cards open instead of hitting TED's 404 page.

update public.content_items
set external_url =
    'https://www.ted.com/talks/matt_walker_sleep_is_your_superpower'
where external_url =
    'https://www.ted.com/talks/matt_walker_why_sleep_is_your_superpower';

update public.content_items
set external_url = 'https://www.youtube.com/watch?v=5MgBikgcWnY'
where external_url =
    'https://www.ted.com/talks/josh_kaufman_the_first_20_hours_how_to_learn_anything';

update public.content_items
set external_url = 'https://www.youtube.com/watch?v=7CBfCW67xT8'
where external_url =
    'https://www.ted.com/talks/richard_davidson_how_mindfulness_changes_the_emotional_life_of_our_brains';

-- A fourth Listen link points at a removed YouTube video (the "Breathing"
-- talk) — repoint to Max Strom's live TEDxCapeMay video.
update public.content_items
set external_url = 'https://www.youtube.com/watch?v=4Lb5L-VEm34'
where external_url = 'https://www.youtube.com/watch?v=jm2gGOsB4kU';
