-- ─────────────────────────────────────────────────────────────────────
-- Seed focus_areas (the 6 curated personal-direction areas).
-- These IDs/labels/hues are the source-of-truth list used by the
-- prototype web app (apps/web/src/app/north/_lib/data.ts:3-10) and
-- referenced by content_items.focus_area_id, user_focus_areas.focus_area_id.
-- Idempotent; safe to re-run via supabase db reset and CI auto-deploy.
-- ─────────────────────────────────────────────────────────────────────
insert into public.focus_areas (id, label, hue, sort_order) values
    ('craft',   'Craft & Mastery',     '#7ec4bb', 10),
    ('venture', 'Building a venture',  '#d4a574', 20),
    ('mind',    'Mind & body',         '#9aaee0', 30),
    ('people',  'People & community',  '#c97a5a', 40),
    ('money',   'Money & freedom',     '#a8b97a', 50),
    ('learn',   'Deeper learning',     '#b39ad8', 60)
on conflict (id) do update
    set label      = excluded.label,
        hue        = excluded.hue,
        sort_order = excluded.sort_order;
