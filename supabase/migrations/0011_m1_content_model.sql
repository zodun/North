-- ─────────────────────────────────────────────────────────────────────
-- M1 data model: onboarding responses + content categorisation + topics.
--
-- Implements DM-M1-01. Adds the followable interest layer (topics,
-- content_item_topics, user_topic_follows), the 10-bucket content
-- classification (content_categories + content_items.content_category_id),
-- and the 7-answer onboarding_responses store per FR-ONB-01/03 and
-- FR-FEED-03 of docs/north-operating-document.md.
--
-- focus_areas (existing 0001_init.sql) is intentionally untouched —
-- it serves a different role (personal mission direction) than
-- content_categories (content classification).
-- ─────────────────────────────────────────────────────────────────────

-- Shared trigger helper. No earlier migration declares this; defined
-- with create-or-replace so future migrations can safely reuse it.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- onboarding_responses (FR-ONB-01/03)
-- 1:1 with auth.users; all answer columns nullable so the flow can be
-- resumed mid-session (FR-ONB-04). completed_at is set when the user
-- finishes the 7th question, signalling mission generation can run.
-- ─────────────────────────────────────────────────────────────────────
create table public.onboarding_responses (
    user_id uuid primary key references auth.users(id) on delete cascade,
    what_feels_missing text,
    desired_future text,
    inspiring_content text,
    what_to_improve text,
    career_interests text,
    biggest_distraction text,
    freedom_from text,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger trg_onboarding_responses_set_updated_at
    before update on public.onboarding_responses
    for each row execute function public.set_updated_at();

alter table public.onboarding_responses enable row level security;

create policy onboarding_responses_self_select
    on public.onboarding_responses for select
    using (auth.uid() = user_id);

create policy onboarding_responses_self_insert
    on public.onboarding_responses for insert
    with check (auth.uid() = user_id);

create policy onboarding_responses_self_update
    on public.onboarding_responses for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- content_categories (FR-FEED-03)
-- Text PK matches focus_areas convention (0001_init.sql:56). Seeded in
-- 0012_seed_content_categories.sql.
-- ─────────────────────────────────────────────────────────────────────
create table public.content_categories (
    id text primary key,
    label text not null,
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);

alter table public.content_categories enable row level security;

create policy content_categories_read
    on public.content_categories for select
    using (true);

create policy content_categories_admin_write
    on public.content_categories for all
    using (public.is_admin())
    with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- content_items.content_category_id
-- Each content_item belongs to one content_category (operating doc §8.3).
-- Nullable so existing rows aren't broken and so curation can backfill.
-- ─────────────────────────────────────────────────────────────────────
alter table public.content_items
    add column content_category_id text references public.content_categories(id) on delete set null;

create index content_items_category_idx
    on public.content_items (content_category_id)
    where content_category_id is not null;

-- ─────────────────────────────────────────────────────────────────────
-- topics
-- Curated, admin-created followable tags (e.g. "remote-work-trinidad").
-- Distinct from content_categories: a content_item has one category but
-- can be tagged with many topics, and a user follows topics, not
-- categories (operating doc §8.2).
-- ─────────────────────────────────────────────────────────────────────
create table public.topics (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    label text not null,
    created_at timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy topics_read
    on public.topics for select
    using (true);

create policy topics_admin_write
    on public.topics for all
    using (public.is_admin())
    with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- content_item_topics (many-to-many join)
-- Composite PK covers reverse-direction lookups; the explicit topic_id
-- index supports the "show all items with topic X" feed-filter path.
-- ─────────────────────────────────────────────────────────────────────
create table public.content_item_topics (
    content_item_id uuid not null references public.content_items(id) on delete cascade,
    topic_id uuid not null references public.topics(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (content_item_id, topic_id)
);

create index content_item_topics_topic_idx
    on public.content_item_topics (topic_id);

alter table public.content_item_topics enable row level security;

-- Public read only when the parent content_item itself is readable.
-- Mirrors the content_items public-read predicate from 0009_content_licensing.sql:75-79.
create policy content_item_topics_read
    on public.content_item_topics for select
    using (exists (
        select 1 from public.content_items ci
        where ci.id = content_item_id
          and ci.license_status = 'cleared'
          and ci.published_at is not null
          and ci.published_at <= now()
    ));

create policy content_item_topics_admin_write
    on public.content_item_topics for all
    using (public.is_admin())
    with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- user_topic_follows
-- Own-rows; cascade-delete with the auth user.
-- ─────────────────────────────────────────────────────────────────────
create table public.user_topic_follows (
    user_id uuid not null references auth.users(id) on delete cascade,
    topic_id uuid not null references public.topics(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, topic_id)
);

create index user_topic_follows_topic_idx
    on public.user_topic_follows (topic_id);

alter table public.user_topic_follows enable row level security;

create policy user_topic_follows_self
    on public.user_topic_follows for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
