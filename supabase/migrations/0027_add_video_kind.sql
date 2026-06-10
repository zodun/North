-- Add 'video' kind to content_items for YouTube feed cards,
-- and a thumbnail_url column for external thumbnail images.

alter table public.content_items
    drop constraint if exists content_items_kind_check;

alter table public.content_items
    add constraint content_items_kind_check
        check (kind in ('essay', 'voice', 'story', 'opportunity', 'video'));

alter table public.content_items
    add column if not exists thumbnail_url text;
