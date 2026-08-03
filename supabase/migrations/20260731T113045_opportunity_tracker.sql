-- ─────────────────────────────────────────────────────────────────────
-- Opportunities: full category set, country column, application tracker.
--
--   1. opportunity_categories — add the roadmap categories that were
--      missing from the 0022 seed (competitions, fellowships,
--      conferences, volunteering, courses, mentorships). Existing ids
--      (job … creator-programme) are untouched.
--
--   2. opportunities.country — country is currently derived client-side
--      from the free-text `location`; this column lets future rows (and
--      the scraper) store it explicitly. Nullable, no backfill.
--
--   3. opportunity_applications — the application tracker. One row per
--      user × opportunity with a pipeline status
--      (saved → applied → interview → offer / closed) and the local
--      notification id of the "3 days before deadline" reminder, so the
--      bell state survives app restarts. Client-owned; server never
--      writes.
--
-- RLS mirrors user_saved_opportunities (0022): own rows only.
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. Extend the category taxonomy ──────────────────────────────────

insert into public.opportunity_categories (id, label, sort_order) values
    ('competition',  'Competitions', 8),
    ('fellowship',   'Fellowships',  9),
    ('conference',   'Conferences',  10),
    ('volunteering', 'Volunteering', 11),
    ('course',       'Courses',      12),
    ('mentorship',   'Mentorships',  13)
on conflict (id) do nothing;

-- ── 2. Explicit country on opportunities ─────────────────────────────

alter table public.opportunities
    add column if not exists country text;

-- ── 3. opportunity_applications ──────────────────────────────────────

create table public.opportunity_applications (
    user_id        uuid not null references auth.users(id) on delete cascade,
    opportunity_id uuid not null references public.opportunities(id) on delete cascade,
    status         text not null default 'saved'
                       check (status in ('saved', 'applied', 'interview', 'offer', 'closed')),
    -- Local notification id for the deadline reminder (device-local;
    -- null = no reminder set).
    reminder_id    text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    primary key (user_id, opportunity_id)
);

create index opportunity_applications_user_idx
    on public.opportunity_applications (user_id, updated_at desc);

alter table public.opportunity_applications enable row level security;

create policy opportunity_applications_self on public.opportunity_applications
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
