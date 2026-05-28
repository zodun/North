-- North · signal score · RLS (DEC-07)
-- Honours operating doc §6.2: "all data access shall be enforced by
-- Supabase Row-Level Security; users shall only ever read/write their
-- own behavioural and profile data."
--
-- signal_summaries is service-role-written from the signal-summary
-- Edge Function; the client only reads its own rows. No write policy
-- for clients — RLS default-deny suffices.

alter table public.signal_summaries enable row level security;

create policy signal_summaries_read_self on public.signal_summaries
    for select using (auth.uid() = user_id);
