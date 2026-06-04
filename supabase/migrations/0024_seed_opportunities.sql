-- OPP-02: Starter set of manually sourced, Caribbean-relevant opportunities.
--
-- All rows start as license_status='draft'. An admin must verify each
-- external_url and attribution_text are accurate, then clear the row
-- via the admin UI (OPP-01) to make it visible to clients.
--
-- Covers all 8 opportunity_categories seeded in 0022.

insert into public.opportunities
    (title, org, category_id, opportunity_type, location, deadline, why, external_url, attribution_text, license_status)
values

-- ── Jobs ────────────────────────────────────────────────────────────

(
    'Remote Software Engineer (Caribbean applicants welcome)',
    'Bboxx',
    'job',
    'Full-time, remote',
    'Remote (Jamaica eligible)',
    'Rolling',
    'Africa/Caribbean-focused clean-energy company actively recruiting from the region.',
    'https://www.bboxx.com/careers/',
    'bboxx.com/careers, 2026',
    'draft'
),

(
    'Data Analyst — Corporate Banking',
    'JN Group',
    'job',
    'Full-time',
    'Kingston, Jamaica',
    'Rolling',
    'One of Jamaica''s largest financial groups, with strong internal mobility.',
    'https://www.jncareers.com/',
    'jncareers.com, 2026',
    'draft'
),

-- ── Internships ─────────────────────────────────────────────────────

(
    'JAMPRO Business Development Internship',
    'JAMPRO — Jamaica Promotions Corporation',
    'internship',
    'Paid, 3 months',
    'Kingston, Jamaica',
    'Rolling',
    'Government trade and investment agency — strong resume signal for Caribbean business careers.',
    'https://www.jampro.gov.jm/about/career-opportunities/',
    'jampro.gov.jm, 2026',
    'draft'
),

(
    'Caribbean Development Bank Summer Intern Programme',
    'Caribbean Development Bank',
    'internship',
    'Paid summer internship',
    'Wildey, Barbados (regional)',
    'February each year',
    'CDB funds infrastructure and development across 19 member countries — opens regional networks.',
    'https://www.caribank.org/about-cdb/working-with-us/careers',
    'caribank.org/careers, 2026',
    'draft'
),

-- ── Scholarships ────────────────────────────────────────────────────

(
    'Commonwealth Distance Learning Scholarships',
    'Commonwealth Scholarship Commission',
    'scholarship',
    'Postgrad, distance learning',
    'UK universities (fully remote)',
    'Approx. January each year',
    'Full funding for a UK postgrad degree studied entirely from Jamaica.',
    'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-distance-learning-scholarships/',
    'cscuk.fcdo.gov.uk, 2026',
    'draft'
),

(
    'UTech Jamaica Vice-Chancellor''s Scholarship',
    'University of Technology, Jamaica',
    'scholarship',
    'Undergraduate merit award',
    'Kingston, Jamaica',
    'Varies by intake',
    'Top academic scholarship from Jamaica''s largest technology-focused university.',
    'https://www.utech.edu.jm/admissions/scholarships-and-bursaries',
    'utech.edu.jm/admissions, 2026',
    'draft'
),

-- ── Accelerators ────────────────────────────────────────────────────

(
    'Branson Centre Entrepreneur Fellowship',
    'Branson Centre of Entrepreneurship — Caribbean',
    'accelerator',
    '6-month fellowship + mentorship',
    'Bridgetown, Barbados / regional',
    'Rolling cohorts',
    'Virgin Group-backed programme. Alumni have raised funding and scaled across the region.',
    'https://www.bransoncentre.org/',
    'bransoncentre.org, 2026',
    'draft'
),

-- ── Grants ──────────────────────────────────────────────────────────

(
    'MSME Business Development Grant',
    'Development Bank of Jamaica',
    'grant',
    'Up to J$500,000 matching grant',
    'Jamaica',
    'Rolling',
    'DBJ grant for small businesses investing in technology, equipment or market expansion.',
    'https://www.dbj.jm/lending/msme-credit-enhancement-programme/',
    'dbj.jm/lending, 2026',
    'draft'
),

-- ── Communities ─────────────────────────────────────────────────────

(
    'Caribbean Developers Union (CDU)',
    'Caribbean Developers Union',
    'community',
    'Free membership, Slack-based',
    'Remote (pan-Caribbean)',
    'Open',
    'Largest regional tech community — job board, study groups, referrals.',
    'https://www.caribbeandevsunion.com/',
    'caribbeandevsunion.com, 2026',
    'draft'
),

-- ── Events ──────────────────────────────────────────────────────────

(
    'Jamaica Tech Summit',
    'Digicel Group / JamTech',
    'event',
    'Annual conference',
    'Kingston, Jamaica',
    'Typically Q3 each year',
    'Premier tech gathering in Jamaica — networking with founders, corporates and diaspora builders.',
    'https://www.jamtech.org/',
    'jamtech.org, 2026',
    'draft'
),

-- ── Creator Programmes ──────────────────────────────────────────────

(
    'IDB Lab Caribbean Creative Economy Programme',
    'IDB Lab (Inter-American Development Bank)',
    'creator-programme',
    'Grant + mentorship for creative entrepreneurs',
    'Regional (Jamaica eligible)',
    'Rolling cohorts',
    'IDB Lab funds cultural and creative ventures — music, film, fashion, digital content.',
    'https://idblab.org/',
    'idblab.org, 2026',
    'draft'
);
