-- North · content licensing schema (operating-doc DEC-10; tracker DEC-06)
-- Adopts a hybrid model: every curated item declares its licensing
-- approach (link-out / cloudinary-hosted / original / unknown) and
-- progresses through a status workflow (draft → cleared) before it
-- becomes publicly readable. RLS predicate on the public-read policy
-- enforces that only `cleared` items ever reach a client.

-- ─────────────────────────────────────────────────────────────────────
-- content_items · licensing columns
-- ─────────────────────────────────────────────────────────────────────
alter table public.content_items
    add column if not exists license_type text
        check (license_type in ('link-out','cloudinary-hosted','original','unknown'))
        default 'unknown';

alter table public.content_items
    add column if not exists cloudinary_public_id text;

alter table public.content_items
    add column if not exists attribution_text text;

alter table public.content_items
    add column if not exists permission_evidence_url text;

alter table public.content_items
    add column if not exists license_status text
        check (license_status in ('draft','cleared','blocked'))
        not null default 'draft';

-- A `cleared` item must have attribution + at least one place to
-- read the body from (external_url for link-out, cloudinary_public_id
-- for hosted, both for hybrid). Drafts and blocked items are exempt.
alter table public.content_items
    drop constraint if exists content_items_cleared_requires_attribution;
alter table public.content_items
    add constraint content_items_cleared_requires_attribution
    check (
        license_status <> 'cleared'
        or (
            attribution_text is not null
            and (external_url is not null or cloudinary_public_id is not null)
        )
    );

-- ─────────────────────────────────────────────────────────────────────
-- opportunities · same status workflow (no cloudinary fields —
-- opportunities are always link-out by construction).
-- ─────────────────────────────────────────────────────────────────────
alter table public.opportunities
    add column if not exists license_status text
        check (license_status in ('draft','cleared','blocked'))
        not null default 'draft';

alter table public.opportunities
    add column if not exists attribution_text text;

alter table public.opportunities
    add column if not exists permission_evidence_url text;

alter table public.opportunities
    drop constraint if exists opportunities_cleared_requires_external_url;
alter table public.opportunities
    add constraint opportunities_cleared_requires_external_url
    check (
        license_status <> 'cleared'
        or external_url is not null
    );

-- ─────────────────────────────────────────────────────────────────────
-- RLS · tighten the public-read policies to require license_status.
-- Existing policies were added in supabase/migrations/0002_rls.sql.
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists content_items_read_published on public.content_items;
create policy content_items_read_published on public.content_items
    for select using (
        license_status = 'cleared'
        and published_at is not null
        and published_at <= now()
    );

drop policy if exists opportunities_read_published on public.opportunities;
create policy opportunities_read_published on public.opportunities
    for select using (
        license_status = 'cleared'
        and published_at is not null
        and published_at <= now()
    );
