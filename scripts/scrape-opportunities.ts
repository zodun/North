#!/usr/bin/env bun
/**
 * scrape-opportunities.ts — scrapes two live opportunity sources and outputs
 * a SQL migration for the opportunities table.
 *
 * Sources:
 *   1. opportunitiesforyouth.org  — WordPress REST API (no scraping needed)
 *   2. opportunities-for-caribbean-youth.org — HTML (listing + detail pages)
 *
 * OUTPUT:
 *   supabase/migrations/0029_seed_scraped_opportunities.sql
 *   Push with: supabase db push  (or paste into the SQL editor)
 *
 * All rows are inserted as license_status='draft'. Review and approve
 * them in the admin UI (or run the bulk-clear snippet printed at the end).
 *
 * Run: bun scripts/scrape-opportunities.ts
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

// ── Config ────────────────────────────────────────────────────────────────────

const OFY_BASE = "https://www.opportunitiesforyouth.org";
// WordPress category IDs confirmed via /wp-json/wp/v2/categories
// Maps WordPress category IDs → valid opportunity_categories.id values
const OFY_CATEGORIES: Array<{ id: number; slug: string }> = [
	{ id: 2, slug: "scholarship" },
	{ id: 5, slug: "grant" },
	{ id: 11, slug: "scholarship" }, // fellowship → scholarship (closest valid category)
	{ id: 4, slug: "job" },
	{ id: 1570, slug: "internship" },
];
const OFY_PER_PAGE = 10; // 5 categories × 10 = 50

const OFCY_BASE = "https://opportunities-for-caribbean-youth.org";
const OFCY_PAGES = 3; // listing pages to scrape (9 items each)

// Delay between OFCY detail page fetches to be polite
const DELAY_MS = 300;

// ── Types ─────────────────────────────────────────────────────────────────────

interface OppRow {
	title: string;
	org: string;
	category_id: string | null;
	opportunity_type: string | null;
	location: string | null;
	deadline: string | null;
	why: string | null;
	external_url: string;
	attribution_text: string;
	license_status: "draft";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escSql(s: string): string {
	return s.replace(/'/g, "''");
}

function sqlStr(v: string | null | undefined): string {
	if (v == null) return "null";
	return `'${escSql(v)}'`;
}

function stripHtml(html: string): string {
	return html
		.replace(/<[^>]+>/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function cleanText(s: string, max = 500): string {
	return stripHtml(s).slice(0, max);
}

/** Best-effort: extract the organisation from a post title like "Harvard X Fellowship 2026 for..." */
function extractOrg(title: string): string {
	// Remove trailing year/deadline e.g. "... 2026", "... 2026/2027"
	const clean = title.replace(/\s+\d{4}(\/\d{4})?.*$/, "").trim();
	// Take up to the first "for", "–", "|", ":", "(", "-" separator
	const sep = clean.search(/\s+(for|–|-|\|:|by)\s+/i);
	if (sep > 4) return clean.slice(0, sep).trim();
	// Fallback: first 50 chars
	return clean.slice(0, 60).trim();
}

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

// ── opportunitiesforyouth.org (WordPress API) ─────────────────────────────────

interface WPPost {
	id: number;
	title: { rendered: string };
	link: string;
	date: string;
	excerpt: { rendered: string };
	categories: number[];
}

async function scrapeOFY(): Promise<OppRow[]> {
	console.log("\n📡  opportunitiesforyouth.org (WordPress API)");
	const rows: OppRow[] = [];
	const seenIds = new Set<number>();

	for (const cat of OFY_CATEGORIES) {
		process.stdout.write(`  Category: ${cat.slug} ... `);
		try {
			const url =
				`${OFY_BASE}/wp-json/wp/v2/posts` +
				`?categories=${cat.id}&per_page=${OFY_PER_PAGE}` +
				"&_fields=id,title,link,date,excerpt,categories";

			const res = await fetch(url, {
				headers: {
					"User-Agent": "NorthApp/1.0 (data pipeline; zoe@getnorth.app)",
				},
			});
			if (!res.ok) {
				console.log(`skipped (HTTP ${res.status})`);
				continue;
			}

			const posts = (await res.json()) as WPPost[];
			let added = 0;

			for (const post of posts) {
				if (seenIds.has(post.id)) continue;
				seenIds.add(post.id);

				const title = cleanText(post.title.rendered, 255);
				const org = extractOrg(title);
				const why = cleanText(post.excerpt.rendered, 400) || null;

				rows.push({
					title,
					org,
					category_id: cat.slug,
					opportunity_type: cat.slug,
					location: null,
					deadline: null,
					why,
					external_url: post.link,
					attribution_text: `opportunitiesforyouth.org, ${new Date(post.date).getFullYear()}`,
					license_status: "draft",
				});
				added++;
			}
			console.log(`${added} posts`);
		} catch (err) {
			console.log(`⚠  ${err}`);
		}
	}

	return rows;
}

// ── opportunities-for-caribbean-youth.org (HTML) ──────────────────────────────

/** Extract all /opportunity/UUID hrefs from a listing page's HTML. */
function extractOFCYLinks(html: string): string[] {
	const uuidPattern =
		/\/opportunity\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
	const seen = new Set<string>();
	const links: string[] = [];
	for (let m = uuidPattern.exec(html); m !== null; m = uuidPattern.exec(html)) {
		const path = `/opportunity/${m[1]}`;
		if (!seen.has(path)) {
			seen.add(path);
			links.push(path);
		}
	}
	return links;
}

/**
 * Parse a single OFCY opportunity page (plain text after fetch).
 * The site renders server-side HTML; we extract fields with heuristic patterns.
 */
function parseOFCYPage(
	text: string,
	fallbackTitle: string,
	_pageUrl: string,
): Partial<OppRow> {
	// Title: first <h1>…</h1>
	const h1 = text.match(/<h1[^>]*>([^<]+)<\/h1>/i);
	const title = h1 ? cleanText(h1[1], 255) : fallbackTitle;

	// Org: look for a label like "Organisation:", "Organization:", "Sponsor:"
	const orgMatch = text.match(
		/(?:organisation|organization|sponsor|offered by)[:\s]+([^\n<]{2,80})/i,
	);
	const org = orgMatch ? cleanText(orgMatch[1], 80) : extractOrg(title);

	// Deadline
	const deadlineMatch = text.match(
		/(?:deadline|closing date|apply by)[:\s]+([^\n<]{4,40})/i,
	);
	const deadline = deadlineMatch ? cleanText(deadlineMatch[1], 80) : null;

	// Location
	const locationMatch = text.match(
		/(?:location|country|region)[:\s]+([^\n<]{2,60})/i,
	);
	const location = locationMatch ? cleanText(locationMatch[1], 80) : null;

	// Category — look for common category labels
	let category_id: string | null = null;
	const catLower = text.toLowerCase();
	if (catLower.includes("scholarship")) category_id = "scholarship";
	else if (catLower.includes("internship")) category_id = "internship";
	else if (catLower.includes("fellowship")) category_id = "fellowship";
	else if (catLower.includes("grant")) category_id = "grant";
	else if (catLower.includes("accelerator") || catLower.includes("programme"))
		category_id = "accelerator";
	else if (catLower.includes("job") || catLower.includes("employment"))
		category_id = "job";
	else if (catLower.includes("award") || catLower.includes("prize"))
		category_id = "event";
	else if (catLower.includes("community") || catLower.includes("ambassador"))
		category_id = "community";

	// Why/description: grab 2–3 sentences from the first paragraph-like block
	const paraMatch = text.match(/<p[^>]*>([^<]{60,})<\/p>/i);
	const why = paraMatch ? cleanText(paraMatch[1], 400) : null;

	return { title, org, deadline, location, category_id, why };
}

async function scrapeOFCY(): Promise<OppRow[]> {
	console.log("\n🌴  opportunities-for-caribbean-youth.org (HTML)");
	const allLinks: string[] = [];

	// 1. Collect opportunity links from listing pages
	for (let page = 1; page <= OFCY_PAGES; page++) {
		process.stdout.write(`  Listing page ${page}/${OFCY_PAGES} ... `);
		try {
			const url =
				page === 1
					? `${OFCY_BASE}/opportunities`
					: `${OFCY_BASE}/opportunities?page=${page}`;
			const res = await fetch(url, {
				headers: {
					"User-Agent": "NorthApp/1.0 (data pipeline; zoe@getnorth.app)",
				},
			});
			if (!res.ok) {
				console.log(`HTTP ${res.status}`);
				continue;
			}
			const html = await res.text();
			const links = extractOFCYLinks(html);
			console.log(`${links.length} links`);
			for (const l of links) {
				if (!allLinks.includes(l)) allLinks.push(l);
			}
		} catch (err) {
			console.log(`⚠  ${err}`);
		}
	}

	if (allLinks.length === 0) {
		console.log("  ⚠  No links found — the site may have changed structure.");
		return [];
	}

	// 2. Fetch each detail page
	console.log(`  Fetching ${allLinks.length} detail pages...`);
	const rows: OppRow[] = [];

	for (const path of allLinks) {
		const fullUrl = `${OFCY_BASE}${path}`;
		process.stdout.write(`  ${path.slice(0, 50)} ... `);
		try {
			await sleep(DELAY_MS);
			const res = await fetch(fullUrl, {
				headers: {
					"User-Agent": "NorthApp/1.0 (data pipeline; zoe@getnorth.app)",
				},
			});
			if (!res.ok) {
				console.log(`HTTP ${res.status}`);
				continue;
			}
			const html = await res.text();
			const parsed = parseOFCYPage(html, "Untitled", fullUrl);

			if (!parsed.title || parsed.title === "Untitled") {
				console.log("skipped (no title)");
				continue;
			}

			rows.push({
				title: parsed.title ?? "Untitled",
				org: parsed.org ?? "Unknown",
				category_id: parsed.category_id ?? null,
				opportunity_type: parsed.category_id,
				location: parsed.location ?? "Caribbean",
				deadline: parsed.deadline ?? null,
				why: parsed.why ?? null,
				external_url: fullUrl,
				attribution_text: "opportunities-for-caribbean-youth.org, 2026",
				license_status: "draft",
			});
			console.log(`✓ ${parsed.title?.slice(0, 50)}`);
		} catch (err) {
			console.log(`⚠  ${err}`);
		}
	}

	return rows;
}

// ── SQL generation ────────────────────────────────────────────────────────────

function toSqlRow(r: OppRow): string {
	return (
		`    (gen_random_uuid(), ${sqlStr(r.title)}, ${sqlStr(r.org)}, ` +
		`${sqlStr(r.category_id)}, ${sqlStr(r.opportunity_type)}, ` +
		`${sqlStr(r.location)}, ${sqlStr(r.deadline)}, ${sqlStr(r.why)}, ` +
		`${sqlStr(r.external_url)}, ${sqlStr(r.attribution_text)}, ` +
		`'draft', now(), now())`
	);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
	const ofyRows = await scrapeOFY();
	const ofcyRows = await scrapeOFCY();

	const allRows = [...ofyRows, ...ofcyRows];

	if (allRows.length === 0) {
		console.error("\n❌  No rows scraped.");
		process.exit(1);
	}

	const sql = `-- Scraped opportunities seed (generated ${new Date().toISOString()})
-- ${ofyRows.length} from opportunitiesforyouth.org
-- ${ofcyRows.length} from opportunities-for-caribbean-youth.org
-- All rows inserted as license_status='draft'.
--
-- To bulk-approve all rows after review:
--   update public.opportunities
--   set license_status = 'cleared',
--       published_at   = now()
--   where license_status = 'draft'
--     and published_at is null;

insert into public.opportunities (
    id, title, org, category_id, opportunity_type,
    location, deadline, why, external_url, attribution_text,
    license_status, created_at, published_at
)
values
${allRows.map(toSqlRow).join(",\n")}
on conflict do nothing;
`;

	const outPath = join(
		import.meta.dir,
		"../supabase/migrations/0029_seed_scraped_opportunities.sql",
	);
	writeFileSync(outPath, sql, "utf8");

	console.log(
		`\n✅  Wrote ${allRows.length} rows → supabase/migrations/0029_seed_scraped_opportunities.sql`,
	);
	console.log("   Next: supabase db push  (or paste into the SQL editor)");
	console.log(
		"   Then: run the bulk-approve UPDATE shown at the top of the file to make them visible.\n",
	);
}

main().catch((err) => {
	console.error("\n❌ ", err);
	process.exit(1);
});
