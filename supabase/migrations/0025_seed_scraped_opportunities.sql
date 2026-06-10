-- Opportunities sourced from:
--   opportunities-for-caribbean-youth.org (Caribbean-specific)
--   opportunitiesforyouth.org (global/youth-focused, open to Caribbean applicants)
--
-- All rows start as license_status='draft'. An admin must clear each
-- row via the admin UI before it becomes visible to app users.

insert into public.opportunities
    (title, org, category_id, opportunity_type, location, deadline, why, external_url, attribution_text, license_status)
values

-- ── From opportunities-for-caribbean-youth.org ───────────────────────

(
    'Genius Project 2026 — AI & Tech Programme',
    'Genius Project',
    'accelerator',
    'Tuition-free cohort programme',
    'Jamaica / Caribbean',
    'June 15, 2026',
    'Fully free AI and technology programme for young people across the Caribbean.',
    'https://opportunities-for-caribbean-youth.org/opportunity/f09b95c1-5c50-4ad2-916d-aeb965761444',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

(
    'Canada Fund for Local Initiatives — Jamaica 2026',
    'Global Affairs Canada',
    'grant',
    'Project grant',
    'Jamaica',
    'June 12, 2026',
    'Canadian government funding for small-scale, high-impact projects in developing countries.',
    'https://opportunities-for-caribbean-youth.org/opportunity/51abe22a-48cc-41c9-bac2-d6da2655687a',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

(
    'Caribbean Telecommunications Union Internship Programme 2026',
    'Caribbean Telecommunications Union',
    'internship',
    'Paid internship',
    'Trinidad & Tobago',
    'June 5, 2026',
    'ICT and digital transformation internship for young Caribbean students and emerging professionals.',
    'https://opportunities-for-caribbean-youth.org/opportunity/ecec178c-bba5-4062-89eb-6804f47730f8',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

(
    'Commonwealth Students'' Association Campus Ambassadors 2026',
    'Commonwealth Students'' Association',
    'community',
    'Ambassador role',
    'Caribbean',
    'June 15, 2026',
    'Represent students, champion advocacy, and drive meaningful change across the Commonwealth.',
    'https://opportunities-for-caribbean-youth.org/opportunity/c350a77d-d401-4013-ba5a-c0c8d3e14c48',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

(
    'FWCF Annual Summer Internship Programme 2026',
    'Fi We Children Foundation',
    'internship',
    'Summer internship',
    'Jamaica',
    'June 5, 2026',
    'Summer internship from one of Jamaica''s active youth development foundations.',
    'https://opportunities-for-caribbean-youth.org/opportunity/be177f6f-03ef-426e-8e8e-2daae4d8c6b0',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

(
    'bmobile Future Leaders Internship Programme 2026',
    'bmobile',
    'internship',
    'Internship',
    'Trinidad & Tobago',
    'June 12, 2026',
    'Internship at one of the Caribbean''s leading telecoms — strong signal for tech and business careers.',
    'https://opportunities-for-caribbean-youth.org/opportunity/e17f1aae-bc48-4297-a8ec-f31854bb0dcf',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

(
    'JN Bank Ambassador Programme 2026',
    'JN Bank',
    'community',
    'Ambassador programme',
    'Jamaica',
    'June 12, 2026',
    'Ambassador role with one of Jamaica''s most community-rooted financial institutions.',
    'https://opportunities-for-caribbean-youth.org/opportunity/5fde2bae-f169-44a9-823e-ffcddfec4fe7',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

(
    'Tech for Good Impact Awards 2026',
    'Tech for Good',
    'grant',
    'Award + software grants ($5,000–$50,000)',
    'Global',
    'July 15, 2026',
    'Free software and cash grants from $5,000 to $50,000 for nonprofits using tech for social impact.',
    'https://opportunities-for-caribbean-youth.org/opportunity/4e5d157c-be2a-428b-b7cd-e6b592629b7b',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

(
    'Global Youth Awards 2026',
    'Global Youth Awards',
    'event',
    'Award nomination',
    'Worldwide',
    'September 1, 2026',
    'International recognition for outstanding young achievers driving change in their communities.',
    'https://opportunities-for-caribbean-youth.org/opportunity/a195259b-d38d-4f57-96d5-cbcc35a8417e',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

(
    'Caribbean Women in Music — WOMEX Market Access Programme 2026',
    'Caribbean Women in Music / WOMEX',
    'creator-programme',
    'Fully funded travel + training',
    'Spain (WOMEX 2026)',
    'June 7, 2026',
    'Training, networking, and fully funded travel to WOMEX in Spain for Caribbean women music entrepreneurs.',
    'https://opportunities-for-caribbean-youth.org/opportunity/f66371ce-42ad-4198-a628-a3f62c814d47',
    'opportunities-for-caribbean-youth.org, 2026',
    'draft'
),

-- ── From opportunitiesforyouth.org (open globally / remote-accessible) ─

(
    'PhD Scholarships at University of Verona 2026/2027',
    'University of Verona',
    'scholarship',
    'PhD — 104 funded positions',
    'Italy',
    'Check website',
    '104 funded PhD positions across disciplines for the XLII Cycle academic year 2026/2027.',
    'https://opportunitiesforyouth.org/2026/06/03/phd-scholarships-at-the-university-of-verona-xlii-cycle-academic-year-2026-2027-full-admission-call-with-104-funded-positions/',
    'opportunitiesforyouth.org, 2026',
    'draft'
),

(
    'France Embassy Fully Funded Master''s Scholarships 2026/2027',
    'Embassy of France',
    'scholarship',
    'Fully funded Master''s',
    'France',
    'Check website',
    'Fully funded Master''s scholarships in France for the 2026/2027 academic year.',
    'https://opportunitiesforyouth.org/2026/06/03/france-embassy-in-uganda-opens-applications-for-fully-funded-masters-scholarships-in-france-for-2026-2027-academic-year/',
    'opportunitiesforyouth.org, 2026',
    'draft'
),

(
    'Harris Impact Fellowship 2026–2027 (Data, AI & Public Policy)',
    'University of Chicago Harris School of Public Policy',
    'accelerator',
    'Career development fellowship',
    'USA',
    'Check website',
    'Fellowship focused on Data, AI, Public Policy, and Social Impact — open to global applicants.',
    'https://opportunitiesforyouth.org/2026/06/03/harris-impact-fellowship/',
    'opportunitiesforyouth.org, 2026',
    'draft'
),

(
    'F5 STEM & AI Education Grants 2026 ($50,000)',
    'F5',
    'grant',
    'Grant up to $50,000 for nonprofits',
    'Africa, Asia, Latin America',
    'Check website',
    '$50,000 available for nonprofits running STEM and AI education programmes — Latin America region eligible.',
    'https://opportunitiesforyouth.org/2026/06/03/f5-opens-applications-for-2026-stem-ai-education-grants-50000-funding-available-for-nonprofits-across-africa-asia-and-latin-america/',
    'opportunitiesforyouth.org, 2026',
    'draft'
),

(
    'Digital Minds Fellowship 2026 — AI Sentience Research (Remote)',
    'Digital Minds Initiative',
    'accelerator',
    'Fully funded remote fellowship',
    'Remote',
    'Check website',
    'Fully funded remote fellowship for researchers, policy experts, and AI professionals exploring AI sentience.',
    'https://opportunitiesforyouth.org/2026/06/04/digital-minds-career-development-fellowships-2026-fully-funded-remote-opportunity-for-researchers-policy-experts-ai-professionals-and-future-leaders-exploring-artificial-intelligence-sentience-and/',
    'opportunitiesforyouth.org, 2026',
    'draft'
),

(
    'ARUA Early-Career Research Fellowship 2026–2027',
    'Association of African Universities (ARUA)',
    'accelerator',
    '6-month research fellowship',
    'Africa (multiple sites)',
    'Check website',
    'Six-month fully funded research positions across Africa for early-career researchers.',
    'https://opportunitiesforyouth.org/2026/06/04/arua-early-career-research-fellowship-2026-2027-six-month-research-opportunities-across-africa/',
    'opportunitiesforyouth.org, 2026',
    'draft'
),

(
    'Global Good Fund Fellowship 2026 — Social Impact Leaders',
    'Global Good Fund',
    'accelerator',
    'Leadership development fellowship',
    'Global',
    'Check website',
    'Leadership development fellowship for high-impact social entrepreneurs and changemakers worldwide.',
    'https://opportunitiesforyouth.org/2026/06/04/the-global-good-fund-fellowship-2026-empowering-social-impact-leaders-worldwide/',
    'opportunitiesforyouth.org, 2026',
    'draft'
),

(
    'Project Coordinator at Seefar (Global Social Enterprise)',
    'Seefar',
    'job',
    'Full-time, remote options',
    'Global',
    'Check website',
    'Project coordination role at a global social enterprise working on migration, justice, and economic inclusion.',
    'https://opportunitiesforyouth.org/2026/06/04/project-coordinator-opportunity-at-seefar-join-a-global-social-enterprise-driving-positive-change/',
    'opportunitiesforyouth.org, 2026',
    'draft'
),

(
    'University of Alberta PhD in Political Science 2026',
    'University of Alberta',
    'scholarship',
    'Fully funded PhD',
    'Canada',
    'Check website',
    'Intensive doctoral programme in political science — strong fit for Caribbean scholars in governance and policy.',
    'https://opportunitiesforyouth.org/2026/06/04/university-of-alberta-phd-in-political-science-2026-a-comprehensive-doctoral-program-for-future-scholars-researchers-and-policy-leaders/',
    'opportunitiesforyouth.org, 2026',
    'draft'
);
