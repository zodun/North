-- Add sort_order and updated_at to content_items (CONTENT-01).
-- sort_order enables manual curation ordering for M1 feed (FR-FEED-04/FEED-05).
-- updated_at tracks when an admin last edited a row.

alter table public.content_items
    add column if not exists sort_order int not null default 0,
    add column if not exists updated_at timestamptz not null default now();

-- Composite index: manual sort within published items for the feed query.
create index if not exists content_items_feed_idx
    on public.content_items (sort_order asc, published_at desc)
    where license_status = 'cleared' and published_at is not null;

-- set_updated_at is declared by 0011_m1_content_model.sql; safe to reuse.
create or replace trigger trg_content_items_set_updated_at
    before update on public.content_items
    for each row execute function public.set_updated_at();
