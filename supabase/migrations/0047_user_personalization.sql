-- ─────────────────────────────────────────────────────────────────────
-- Personalization cache (AI-07, premium)
--
-- The `personalize` Edge Function ranks a user's For You feed and Opportunities
-- with Claude and writes a short reason for the top picks. It's a premium-only
-- feature (see public.is_premium) and runs on-demand, cached once per user per
-- surface per day so page loads stay instant after the first visit.
--
-- ranking jsonb shape: [{ "id": "<item id>", "why": "<reason or empty>" }, ...]
-- ordered best-first. Writes happen via the service role inside the function.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.user_personalization (
    user_id    uuid not null references auth.users (id) on delete cascade,
    surface    text not null check (surface in ('feed', 'opportunities')),
    day        date not null,
    ranking    jsonb not null,
    created_at timestamptz not null default now(),
    primary key (user_id, surface, day)
);

alter table public.user_personalization enable row level security;

-- Owner-read only; the function writes with the service role.
create policy user_personalization_read_own on public.user_personalization
    for select using (auth.uid() = user_id);
