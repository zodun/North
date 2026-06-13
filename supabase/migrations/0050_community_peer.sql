-- Community (peer support) — a text-based peer feed for the new Community tab.
--
-- NOTE: the existing `community_posts` table is the VIDEO community on the For
-- You feed (post_type opportunity_tip / mission_progress). To avoid colliding
-- with it, the peer feed uses peer_* tables.
--
-- Gamification writes to profiles.community_points — a NEW wallet kept separate
-- from the weekly-computed signal_scores so it never corrupts the score shown
-- on Mission / Profile. Cross-user display data is exposed through the minimal
-- `public_profiles` view (only safe columns), not by loosening profiles RLS.

-- ── Points wallet (separate from the computed signal score) ──────────────────
alter table public.profiles
    add column if not exists community_points integer not null default 0;

-- ── peer_posts ───────────────────────────────────────────────────────────────
create table public.peer_posts (
    id            uuid        primary key default gen_random_uuid(),
    user_id       uuid        not null references auth.users(id) on delete cascade,
    category      text        not null check (category in ('win','question','accountability','opportunity','general')),
    title         text,
    body          text        not null,
    is_anonymous  boolean     not null default false,
    likes_count   integer     not null default 0,
    replies_count integer     not null default 0,
    signal_boost  boolean     not null default false,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

alter table public.peer_posts enable row level security;
create policy peer_posts_select on public.peer_posts
    for select using (auth.uid() is not null);
create policy peer_posts_insert on public.peer_posts
    for insert with check (auth.uid() = user_id);
create policy peer_posts_update on public.peer_posts
    for update using (auth.uid() = user_id);
create policy peer_posts_delete on public.peer_posts
    for delete using (auth.uid() = user_id);

create index peer_posts_feed_idx     on public.peer_posts (created_at desc);
create index peer_posts_category_idx on public.peer_posts (category, created_at desc);
create index peer_posts_user_idx     on public.peer_posts (user_id);

-- ── peer_replies ─────────────────────────────────────────────────────────────
create table public.peer_replies (
    id          uuid        primary key default gen_random_uuid(),
    post_id     uuid        not null references public.peer_posts(id) on delete cascade,
    user_id     uuid        not null references auth.users(id) on delete cascade,
    body        text        not null,
    likes_count integer     not null default 0,
    created_at  timestamptz not null default now()
);

alter table public.peer_replies enable row level security;
create policy peer_replies_select on public.peer_replies
    for select using (auth.uid() is not null);
create policy peer_replies_insert on public.peer_replies
    for insert with check (auth.uid() = user_id);
create policy peer_replies_update on public.peer_replies
    for update using (auth.uid() = user_id);
create policy peer_replies_delete on public.peer_replies
    for delete using (auth.uid() = user_id);

create index peer_replies_post_idx on public.peer_replies (post_id, created_at);

-- ── peer_likes ───────────────────────────────────────────────────────────────
create table public.peer_likes (
    id         uuid        primary key default gen_random_uuid(),
    user_id    uuid        not null references auth.users(id) on delete cascade,
    post_id    uuid        not null references public.peer_posts(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, post_id)
);

alter table public.peer_likes enable row level security;
create policy peer_likes_select on public.peer_likes
    for select using (auth.uid() is not null);
create policy peer_likes_insert on public.peer_likes
    for insert with check (auth.uid() = user_id);
create policy peer_likes_delete on public.peer_likes
    for delete using (auth.uid() = user_id);

create index peer_likes_post_idx on public.peer_likes (post_id);

-- ── accountability_pairs ─────────────────────────────────────────────────────
create table public.accountability_pairs (
    id         uuid        primary key default gen_random_uuid(),
    user_id_1  uuid        not null references auth.users(id) on delete cascade,
    user_id_2  uuid        not null references auth.users(id) on delete cascade,
    status     text        not null default 'pending' check (status in ('pending','active','ended')),
    created_at timestamptz not null default now(),
    unique (user_id_1, user_id_2)
);

alter table public.accountability_pairs enable row level security;
-- Either party can see / update / end the pairing; only the initiator inserts.
create policy accountability_pairs_select on public.accountability_pairs
    for select using (auth.uid() = user_id_1 or auth.uid() = user_id_2);
create policy accountability_pairs_insert on public.accountability_pairs
    for insert with check (auth.uid() = user_id_1);
create policy accountability_pairs_update on public.accountability_pairs
    for update using (auth.uid() = user_id_1 or auth.uid() = user_id_2);
create policy accountability_pairs_delete on public.accountability_pairs
    for delete using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

-- ── Counters + points (SECURITY DEFINER so a liker/replier can update another
--    user's post counters and award points without tripping post-owner RLS) ───
create or replace function public.peer_award_points(p_user uuid, p_points int)
returns void
language sql
security definer
set search_path = public
as $$
    update public.profiles
       set community_points = community_points + p_points,
           updated_at = now()
     where user_id = p_user;
$$;

create or replace function public.peer_post_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.peer_award_points(new.user_id, 5);  -- +5 for posting
    return new;
end;
$$;
create trigger peer_post_ai
    after insert on public.peer_posts
    for each row execute function public.peer_post_after_insert();

create or replace function public.peer_like_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_owner uuid;
    v_count integer;
begin
    update public.peer_posts
       set likes_count = likes_count + 1
     where id = new.post_id
     returning user_id, likes_count into v_owner, v_count;

    perform public.peer_award_points(new.user_id, 1);          -- +1 for liking
    if v_owner is not null and v_owner <> new.user_id then
        perform public.peer_award_points(v_owner, 2);          -- +2 to author
    end if;

    if v_count > 20 then
        update public.peer_posts set signal_boost = true where id = new.post_id;
    end if;
    return new;
end;
$$;
create trigger peer_like_ai
    after insert on public.peer_likes
    for each row execute function public.peer_like_after_insert();

create or replace function public.peer_like_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.peer_posts
       set likes_count = greatest(0, likes_count - 1)
     where id = old.post_id;
    return old;
end;
$$;
create trigger peer_like_ad
    after delete on public.peer_likes
    for each row execute function public.peer_like_after_delete();

create or replace function public.peer_reply_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_owner uuid;
begin
    update public.peer_posts
       set replies_count = replies_count + 1
     where id = new.post_id
     returning user_id into v_owner;

    if v_owner is not null and v_owner <> new.user_id then
        perform public.peer_award_points(v_owner, 3);          -- +3 to author
    end if;
    return new;
end;
$$;
create trigger peer_reply_ai
    after insert on public.peer_replies
    for each row execute function public.peer_reply_after_insert();

-- ── public_profiles — minimal cross-user view for community surfaces ─────────
-- A view runs with its owner's privileges, so it bypasses profiles' self-only
-- RLS and can read every row. It deliberately exposes ONLY non-sensitive
-- columns; statement_of_intent / avoid_note / fields stay private. Access is
-- gated by the grant below (signed-in users only).
create view public.public_profiles as
select
    p.user_id,
    p.display_name,
    p.country,
    p.community_points,
    (
        select array_agg(ufa.focus_area_id)
        from public.user_focus_areas ufa
        where ufa.user_id = p.user_id
    ) as focus_area_ids,
    (
        select s.band
        from public.signal_scores s
        where s.user_id = p.user_id
        order by s.week_ending desc
        limit 1
    ) as signal_band,
    (
        select s.raw_score
        from public.signal_scores s
        where s.user_id = p.user_id
        order by s.week_ending desc
        limit 1
    ) as signal_score
from public.profiles p;

revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;
