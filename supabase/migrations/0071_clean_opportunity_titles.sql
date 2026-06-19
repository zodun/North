-- ── 0071: Clean existing opportunity titles and org names ───────────────────
--
-- Fixes two problems introduced by the RSS scraper:
--   1. HTML entities left in titles (&#038; → &, &#8217; → ', etc.)
--   2. Titles that are full SEO blog headlines (shortened at first colon)
--   3. Org names that are just the first ~60 chars of the title
--
-- Safe: uses IF NOT EXISTS / WHERE guards; existing clean rows are untouched.

-- ── 1. Decode common numeric HTML entities in titles ─────────────────────────

update public.opportunities
set title = replace(replace(replace(replace(replace(replace(replace(replace(replace(
  title,
  '&#038;',  '&'),
  '&#8217;', ''''),
  '&#8216;', ''''),
  '&#8220;', '"'),
  '&#8221;', '"'),
  '&#8211;', '-'),
  '&#8212;', '-'),
  '&amp;',   '&'),
  '&nbsp;',  ' ')
where title ~ '&#[0-9]+;' or title like '%&amp;%' or title like '%&nbsp;%';

-- ── 2. Shorten long titles at the first colon ────────────────────────────────
-- Before: "Knight-Hennessy Scholars Program 2027 at Stanford University: Fully Funded..."
-- After:  "Knight-Hennessy Scholars Program 2027 at Stanford University"

update public.opportunities
set title = trim(split_part(title, ':', 1))
where
  length(title) > 80
  and position(':' in title) > 20       -- colon is not right at the start
  and length(trim(split_part(title, ':', 1))) >= 20;  -- before-colon is meaningful

-- ── 3. Fix org names that are obviously wrong (start of title) ───────────────
-- When org was extracted as the first 60 chars of the title, it often contains
-- words like "Opens", "Announces", "Scholarship at" that reveal the error.
-- Reset these to 'Various'; the next scrape run will populate them correctly.

update public.opportunities
set org = 'Various'
where
  org like '% Opens%'
  or org like '% Announces%'
  or org like '% Opportunity at%'
  or org like '% Is Searching%'
  or org like '% Supporting%'
  or org like '%Fully Funded%'
  or org like '% Grant Round%'
  or org like '% for 20%'      -- "Grants for 2026..."
  or (length(org) > 55 and org ~ '[A-Z].*[A-Z].*[A-Z]');  -- looks truncated

-- ── 4. Extract org from title for rows now marked 'Various' ─────────────────
-- Pattern A: "[Programme] at [University/Org]"
update public.opportunities
set org = trim(
  regexp_replace(
    (regexp_match(title, '\bat\s+([A-Z][A-Za-z0-9\-/&''. ]{3,50}?)(?:\s+for\b|\s+in\b|\s+with\b|[,:(]|$)'))[1],
    '\s+(for|in|with|to|the|and)\s*$', '', 'i'
  )
)
where org = 'Various'
  and title ~ '\bat\s+[A-Z]';

-- Pattern B: "[Org] Opens/Announces/Awards/Launches..."
update public.opportunities
set org = trim(
  (regexp_match(title, '^((?:University of\s+)?[A-Z][A-Za-z0-9\-/&''. ]{2,55}?)\s+(?:Opens|Announces|Awards|Invites|Offers|Launches|Releases|Accepts|Calls|Provides|Grants|Funds|Recruits|Begins|Supports)\b'))[1]
)
where org = 'Various'
  and title ~ '^[A-Z].*\s+(?:Opens|Announces|Awards|Invites|Offers|Launches|Releases|Accepts|Calls|Provides|Grants|Funds|Recruits|Begins|Supports)\b';

-- Pattern C: "[Org] Scholarship/Fellowship/Grant/Programme/Jobs/Fund..."
update public.opportunities
set org = trim(
  (regexp_match(title, '^((?:University of\s+)?[A-Z][A-Za-z0-9\-/&''. ]{2,55}?)\s+(?:Scholarship|Scholarships|Fellowship|Fellowships|Grant|Grants|Programme|Programs?|Jobs|Positions|Fund|Award|Doctoral|PhD|Postdoc|Internship|Bursary|Accelerator|MBA|Master''s|Bachelor)\b'))[1]
)
where org = 'Various'
  and title ~ '^[A-Z].*\s+(?:Scholarship|Scholarships|Fellowship|Fellowships|Grant|Grants|Programme|Programs?|Jobs|Positions|Fund|Award|Doctoral|PhD|Postdoc|Internship|Bursary|Accelerator|MBA|Master''s|Bachelor)\b';
