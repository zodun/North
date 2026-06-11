-- Replace broken feeds with working alternatives.
update public.scrape_sources set
    name = 'ReliefWeb Jobs',
    feed_url = 'https://reliefweb.int/updates/rss.xml'
where id = 'youth4work';

update public.scrape_sources set
    name = 'Idealist',
    feed_url = 'https://www.idealist.org/feed/jobs/rss'
where id = 'youthop';
