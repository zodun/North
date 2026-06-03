-- ─────────────────────────────────────────────────────────────────────
-- SIGCAP-01: Behavioural event schema — content/topic context + append-only.
--
-- Three changes:
--
-- 1. Denormalise content_category_id and kind onto content_interactions so
--    the signal-score weekly rollup (M3 SIG-01) can aggregate by category
--    and content type without joining back to content_items.
--
-- 2. Add a composite index (user_id, content_category_id, action, created_at)
--    for the per-user-per-category signal score query pattern.
--
-- 3. Replace the broad 'for all' RLS policy with separate select + insert
--    policies (no update, no delete from the client), making
--    content_interactions an append-only behavioural log.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Content context columns (nullable; backfilled by the client on insert).
alter table public.content_interactions
    add column content_category_id text references public.content_categories(id) on delete set null,
    add column kind text;

-- 2. Composite index for signal score rollups by user + category.
create index content_interactions_user_cat_action_idx
    on public.content_interactions (user_id, content_category_id, action, created_at desc)
    where content_category_id is not null;

-- 3. Append-only RLS: drop the broad policy, add fine-grained replacements.
--    Users may read their own rows (needed to hydrate saved/matters state in the
--    client) and insert new ones, but never update or delete — the log is permanent.
drop policy content_interactions_self on public.content_interactions;

create policy content_interactions_self_select
    on public.content_interactions for select
    using (auth.uid() = user_id);

create policy content_interactions_self_insert
    on public.content_interactions for insert
    with check (auth.uid() = user_id);
