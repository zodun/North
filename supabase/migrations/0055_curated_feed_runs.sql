-- Throttle for the curated content ingestion (/api/curated-feed).
--
-- The curated system fetches real reputable resources from approved RSS feeds and
-- the YouTube Data API and upserts them into content_items, which the For You feed
-- already reads. To avoid hammering those feeds on every page load, the route
-- records the last fetch time per focus-area key here and skips a fresh fetch
-- inside a 30-minute window.
--
-- Written only by the server (service role), which bypasses RLS; no client
-- policies are needed.

create table if not exists public.curated_feed_runs (
	focus_key   text primary key,
	ran_at      timestamptz not null default now(),
	item_count  integer not null default 0
);

alter table public.curated_feed_runs enable row level security;

comment on table public.curated_feed_runs is
	'Last curated-feed ingestion time per focus-area key; gives /api/curated-feed a 30-minute cache so RSS/YouTube are not refetched on every load.';
