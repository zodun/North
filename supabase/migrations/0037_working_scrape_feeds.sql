-- Repoint the four dead/blocked RSS sources at feeds that actually return
-- items when fetched with the scraper's User-Agent. Verified 2026-06-10:
--   youthop          → youthop.com/feed now 404s
--   scholars4dev     → serves a valid but permanently-empty channel
--   afterschool-africa → /feed redirects to the HTML homepage
--   youth4work       → devex.com/jobs/rss is behind a Cloudflare challenge
-- Supersedes the partial fix in 0036_fix_scrape_sources.sql.

update public.scrape_sources set
    name = 'Opportunities for Youth',
    feed_url = 'https://opportunitiesforyouth.org/feed/'
where id = 'youthop';

update public.scrape_sources set
    name = 'Mladiinfo',
    feed_url = 'https://mladiinfo.eu/feed/'
where id = 'scholars4dev';

update public.scrape_sources set
    name = 'Opportunities for Young Kenyans',
    feed_url = 'https://www.opportunitiesforyoungkenyans.co.ke/feed/'
where id = 'afterschool-africa';

update public.scrape_sources set
    name = 'ReliefWeb Updates',
    feed_url = 'https://reliefweb.int/updates/rss.xml'
where id = 'youth4work';
