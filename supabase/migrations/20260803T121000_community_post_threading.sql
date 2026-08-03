-- Discussion threading columns for community_posts.
--
-- The native Community tab has been inserting `kind` and `parent_post_id`
-- since the discussion redesign, but the columns never landed in a
-- migration (0027 added `kind` to content_items, not here), so the client
-- silently fell back to a legacy insert and replies collapsed into
-- top-level updates. This makes the write path real:
--   kind            update | question | answer | story
--   parent_post_id  the post being replied to; a deleted parent detaches
--                   the reply rather than deleting it.

alter table public.community_posts
    add column if not exists kind text not null default 'update'
        check (kind in ('update', 'question', 'answer', 'story')),
    add column if not exists parent_post_id uuid
        references public.community_posts (id) on delete set null;

create index if not exists community_posts_parent_idx
    on public.community_posts (parent_post_id);
