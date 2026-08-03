-- Feed social layer: likes, comments, and creator follows for the For You deck.
--
-- item_id is a plain uuid (no FK) on likes/comments because a feed slide can
-- point at either public.content_items (curated) or public.community_posts
-- (user videos) — the client treats the feed as one id space.
--
-- feed_likes exists separately from content_interactions because that log is
-- append-only and readable only by its owner (0017), so it can neither toggle
-- nor produce a global count. Likes here are toggleable (insert/delete) and
-- readable by any authenticated user so slides can show real counts. The
-- client still mirrors nothing into content_interactions — the signal score
-- keeps reading the existing matters/save actions untouched.

-- ── Likes ────────────────────────────────────────────────────────────────

create table public.feed_likes (
    user_id     uuid        not null references auth.users(id) on delete cascade,
    item_id     uuid        not null,
    created_at  timestamptz not null default now(),
    primary key (user_id, item_id)
);

alter table public.feed_likes enable row level security;

-- Any authenticated user can read likes (needed for per-item counts).
create policy feed_likes_select on public.feed_likes
    for select using (auth.uid() is not null);

create policy feed_likes_insert on public.feed_likes
    for insert with check (auth.uid() = user_id);

-- Delete own like = unlike (the toggle).
create policy feed_likes_delete on public.feed_likes
    for delete using (auth.uid() = user_id);

create index feed_likes_item_idx on public.feed_likes (item_id);

-- ── Comments ─────────────────────────────────────────────────────────────

create table public.feed_comments (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    item_id     uuid        not null,
    body        text        not null check (char_length(btrim(body)) between 1 and 2000),
    created_at  timestamptz not null default now()
);

alter table public.feed_comments enable row level security;

create policy feed_comments_select on public.feed_comments
    for select using (auth.uid() is not null);

create policy feed_comments_insert on public.feed_comments
    for insert with check (auth.uid() = user_id);

-- Authors can remove their own comments; no updates (edit = delete + repost).
create policy feed_comments_delete on public.feed_comments
    for delete using (auth.uid() = user_id);

create index feed_comments_item_idx on public.feed_comments (item_id, created_at);

-- ── Creator follows ──────────────────────────────────────────────────────

create table public.creator_follows (
    follower_id uuid        not null references auth.users(id) on delete cascade,
    creator_id  uuid        not null references auth.users(id) on delete cascade,
    created_at  timestamptz not null default now(),
    primary key (follower_id, creator_id),
    check (follower_id <> creator_id)
);

alter table public.creator_follows enable row level security;

-- Followers read their own follow list; creators can see who follows them.
create policy creator_follows_select on public.creator_follows
    for select using (auth.uid() = follower_id or auth.uid() = creator_id);

create policy creator_follows_insert on public.creator_follows
    for insert with check (auth.uid() = follower_id);

create policy creator_follows_delete on public.creator_follows
    for delete using (auth.uid() = follower_id);

create index creator_follows_creator_idx on public.creator_follows (creator_id);
