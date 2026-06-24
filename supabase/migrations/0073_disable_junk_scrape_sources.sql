-- ── 0073: Disable junk scrape sources & purge their rows ─────────────────────
-- The Opportunities page was surfacing non-opportunities. Three seeded sources
-- (0070) feed the opportunities table with content that isn't opportunities:
--
--   jis-jamaica  jis.gov.jm/feed/  → Jamaica Information Service general NEWS RSS
--                                    ("Cabinet Approves Cement Imports", etc.)
--   jampro       jampro.com/feed/  → WRONG company. The Jamaican trade/invest
--                                    agency JAMPRO is jampro.org; .com is a US
--                                    broadcast-antenna maker ("How to Install RF
--                                    Connectors", "Antenna Systems for Tanzania").
--   mof-jamaica  mof.gov.jm (html) → generic landing pages + stale items
--                                    ("Careers", "Scholarships and Assistance",
--                                    a 2021 COVID programme).
--
-- The scraper only pulls sources where enabled = true, so disabling stops
-- re-ingestion; we also delete the already-scraped rows. No user has saved any
-- of these (checked), so the delete orphans nothing.

update public.scrape_sources
set enabled = false
where id in ('jis-jamaica', 'jampro', 'mof-jamaica');

delete from public.opportunities
where source in ('jis-jamaica', 'jampro', 'mof-jamaica');
