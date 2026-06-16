-- Security: enable RLS on public.scrape_sources (advisor: "RLS Disabled in
-- Public"). It holds scraper config (RSS feed URLs + run metadata) and is read
-- and written ONLY by the scrape-opportunities Edge Function via the service
-- role, which bypasses RLS. No client (anon or authenticated) needs it.
--
-- Enabling RLS with no policies denies all anon/authenticated access while the
-- service-role scraper keeps full access — closing the public-API exposure
-- (and the feed-URL tampering it allowed) with zero behaviour change.
alter table public.scrape_sources enable row level security;
