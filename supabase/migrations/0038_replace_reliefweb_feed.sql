-- ReliefWeb (set in 0037) returns its feed to residential IPs but serves a
-- bot-challenge page to datacenter IPs, so the Edge Function parsed 0 items
-- from it — same failure mode as the original devex.com feed. Swap in a plain
-- WordPress feed, which is what every source that scrapes successfully uses.
-- Verified 2026-06-10: oyaop.com/feed/ returns 10 items.

update public.scrape_sources set
    name = 'Opportunities for Young Africans',
    feed_url = 'https://oyaop.com/feed/'
where id = 'youth4work';
