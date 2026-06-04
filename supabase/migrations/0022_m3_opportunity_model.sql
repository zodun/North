-- ─────────────────────────────────────────────────────────────────────
-- DM-M3-01: M3 opportunity data model.
--
-- signal_scores and opportunities already exist from 0001/0002.
-- This migration adds the three missing tables and the category FK:
--
--   1. opportunity_categories — curated taxonomy for the filter bar.
--      Seeded with the 8 types from FR-OPP-01.
--
--   2. opportunities.category_id FK — formalises the free-text
--      opportunity_type into a proper FK for OPP-03 filtering.
--      The original opportunity_type column is retained for free-text
--      description; category_id drives the filter UI.
--
--   3. user_saved_opportunities — save + apply state per user ×
--      opportunity (OPP-04). Tracks whether the user has applied so
--      the Profile placeholder can eventually display it.
--
--   4. opportunity_submissions — intake form rows (OPP-05). Any
--      authenticated user can submit; status starts as 'pending' and
--      is moved to 'approved'/'rejected' by an admin. Approved rows
--      are candidates for manual promotion to opportunities.
--
-- RLS follows the same pattern as the rest of the schema:
--   - opportunity_categories: public read, admin write.
--   - user_saved_opportunities: own rows (select + insert + update + delete).
--   - opportunity_submissions: submitter can read own rows, anyone
--     authenticated can insert; admin can read all and update status.
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. opportunity_categories ────────────────────────────────────────

create table public.opportunity_categories (
    id text primary key,
    label text not null,
    sort_order int not null default 0
);

insert into public.opportunity_categories (id, label, sort_order) values
    ('job',              'Jobs',               0),
    ('internship',       'Internships',         1),
    ('scholarship',      'Scholarships',        2),
    ('accelerator',      'Accelerators',        3),
    ('grant',            'Grants',              4),
    ('community',        'Communities',         5),
    ('event',            'Events',              6),
    ('creator-programme','Creator Programmes',  7);

alter table public.opportunity_categories enable row level security;

create policy opportunity_categories_read_all on public.opportunity_categories
    for select using (true);

create policy opportunity_categories_admin_write on public.opportunity_categories
    for all using (public.is_admin()) with check (public.is_admin());

-- ── 2. FK from opportunities → opportunity_categories ────────────────

alter table public.opportunities
    add column category_id text references public.opportunity_categories(id) on delete set null;

create index opportunities_category_idx
    on public.opportunities (category_id)
    where category_id is not null;

-- ── 3. user_saved_opportunities ──────────────────────────────────────
-- Tracks saves and apply-clicks per user × opportunity. The `applied`
-- flag is set by the client when the user taps "Apply"; `applied_at`
-- is set in the same update. Server never writes to this table.

create table public.user_saved_opportunities (
    user_id        uuid not null references auth.users(id) on delete cascade,
    opportunity_id uuid not null references public.opportunities(id) on delete cascade,
    saved_at       timestamptz not null default now(),
    applied        boolean not null default false,
    applied_at     timestamptz,
    primary key (user_id, opportunity_id),
    constraint applied_at_requires_applied
        check (applied_at is null or applied = true)
);

create index user_saved_opportunities_user_idx
    on public.user_saved_opportunities (user_id, saved_at desc);

alter table public.user_saved_opportunities enable row level security;

create policy user_saved_opportunities_self on public.user_saved_opportunities
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ── 4. opportunity_submissions ───────────────────────────────────────
-- Intake rows from the "submit an opportunity" form (OPP-05). Admin
-- reviews and either promotes to opportunities or rejects.

create table public.opportunity_submissions (
    id               uuid primary key default gen_random_uuid(),
    submitted_by     uuid references auth.users(id) on delete set null,
    submitter_email  text,
    title            text not null,
    org              text not null,
    opportunity_type text,
    location         text,
    deadline         text,
    description      text,
    external_url     text,
    status           text not null default 'pending'
                         check (status in ('pending', 'approved', 'rejected')),
    reviewed_at      timestamptz,
    created_at       timestamptz not null default now(),
    constraint submitter_identity_required
        check (submitted_by is not null or submitter_email is not null)
);

create index opportunity_submissions_status_idx
    on public.opportunity_submissions (status, created_at desc);

alter table public.opportunity_submissions enable row level security;

-- Authenticated users can submit.
create policy opportunity_submissions_insert on public.opportunity_submissions
    for insert
    with check (auth.uid() is not null);

-- Submitters can read their own pending/rejected submissions.
create policy opportunity_submissions_read_own on public.opportunity_submissions
    for select
    using (auth.uid() = submitted_by);

-- Admins can read all submissions and update status.
create policy opportunity_submissions_admin_read on public.opportunity_submissions
    for select
    using (public.is_admin());

create policy opportunity_submissions_admin_update on public.opportunity_submissions
    for update
    using (public.is_admin())
    with check (public.is_admin());
