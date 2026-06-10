-- community_posts: user-generated content on the For You feed.
--
-- post_type distinguishes two intents:
--   'opportunity_tip'   — "I heard about this opportunity"
--   'mission_progress'  — "Here's progress on my mission"
--
-- video_url is nullable so the row can exist before the upload completes
-- (optimistic insert → upload → patch video_url).
-- opportunity_id optionally links an opportunity_tip to a specific opportunity.

create table public.community_posts (
    id              uuid        primary key default gen_random_uuid(),
    user_id         uuid        not null references auth.users(id) on delete cascade,
    post_type       text        not null check (post_type in ('opportunity_tip', 'mission_progress')),
    caption         text,
    video_url       text,
    thumbnail_url   text,
    opportunity_id  uuid        references public.opportunities(id) on delete set null,
    created_at      timestamptz not null default now()
);

alter table public.community_posts enable row level security;

-- Anyone authenticated can read community posts
create policy community_posts_select on public.community_posts
    for select using (auth.uid() is not null);

-- Users can only create their own posts
create policy community_posts_insert on public.community_posts
    for insert with check (auth.uid() = user_id);

-- Users can update their own posts (e.g. patch video_url after upload)
create policy community_posts_update on public.community_posts
    for update using (auth.uid() = user_id);

-- Users can delete their own posts
create policy community_posts_delete on public.community_posts
    for delete using (auth.uid() = user_id);

create index community_posts_feed_idx on public.community_posts (created_at desc);
create index community_posts_user_idx  on public.community_posts (user_id);
