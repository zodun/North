-- ─────────────────────────────────────────────────────────────────────
-- Seed the 10 fixed content_categories (DM-M1-02).
-- The list is fixed by FR-FEED-03 (operating doc §6.1, line 192).
-- Idempotent via ON CONFLICT so this can be re-run on every db reset
-- and every CI auto-deploy without errors.
-- ─────────────────────────────────────────────────────────────────────
insert into public.content_categories (id, label, sort_order) values
    ('purpose',           'Purpose',            10),
    ('careers',           'Careers',            20),
    ('entrepreneurship',  'Entrepreneurship',   30),
    ('remote-work',       'Remote work',        40),
    ('ai',                'AI',                 50),
    ('caribbean-success', 'Caribbean success',  60),
    ('self-development',  'Self development',   70),
    ('opportunities',     'Opportunities',      80),
    ('productivity',      'Productivity',       90),
    ('mental-clarity',    'Mental clarity',    100)
on conflict (id) do update
    set label = excluded.label,
        sort_order = excluded.sort_order;
