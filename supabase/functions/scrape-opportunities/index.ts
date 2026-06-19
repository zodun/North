// Edge Function: scrape-opportunities
//
// Fetches RSS feeds and HTML pages from global + Jamaica/Caribbean opportunity
// sources, normalises each item into the public.opportunities schema, tags it
// with focus areas and a region, and upserts into Supabase.
// Called daily at 06:00 UTC by pg_cron.
//
// Environment secrets required:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SCRAPE_SECRET (optional auth)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { stripDashes } from "../_shared/text.ts";

// ── Focus-area keyword mapping ─────────────────────────────────────────────

const FOCUS_KEYWORDS: Record<string, string[]> = {
	craft: [
		"design",
		"art",
		"creative",
		"engineering",
		"technology",
		"coding",
		"programming",
		"software",
		"developer",
		"architecture",
		"film",
		"music",
		"writing",
		"photography",
		"animation",
		"craft",
		"maker",
		"hardware",
	],
	venture: [
		"entrepreneurship",
		"startup",
		"business",
		"accelerator",
		"incubator",
		"founder",
		"innovation",
		"entrepreneur",
		"pitch",
		"venture",
		"enterprise",
		"sme",
		"commerce",
		"co-founder",
	],
	mind: [
		"health",
		"wellness",
		"mental",
		"psychology",
		"fitness",
		"wellbeing",
		"mindfulness",
		"medical",
		"clinical",
		"therapy",
		"sport",
		"nutrition",
		"rehabilitation",
		"public health",
	],
	people: [
		"community",
		"social",
		"volunteer",
		"leadership",
		"humanitarian",
		"nonprofit",
		"development",
		"impact",
		"advocacy",
		"policy",
		"justice",
		"rights",
		"gender",
		"environment",
		"climate",
		"sustainability",
		"ngo",
		"civil society",
	],
	money: [
		"finance",
		"economics",
		"investment",
		"banking",
		"accounting",
		"financial",
		"trading",
		"fiscal",
		"wealth",
		"fintech",
		"microfinance",
	],
	learn: [
		"scholarship",
		"fellowship",
		"research",
		"education",
		"academic",
		"study",
		"university",
		"degree",
		"training",
		"learning",
		"course",
		"master",
		"phd",
		"doctorate",
		"postdoc",
		"exchange",
		"erasmus",
		"bursary",
	],
};

// ── Opportunity-type / category inference ──────────────────────────────────

function inferCategory(text: string): string {
	const t = text.toLowerCase();
	if (/scholarship|bursary|award|prize/.test(t)) return "scholarship";
	if (/fellowship|traineeship|placement/.test(t)) return "internship";
	if (/internship/.test(t)) return "internship";
	if (/accelerator|incubator/.test(t)) return "accelerator";
	if (/grant|funding|fund/.test(t)) return "grant";
	if (/conference|summit|hackathon|competition|contest|bootcamp/.test(t))
		return "event";
	if (/community|network|membership/.test(t)) return "community";
	if (/\bjob\b|career|position|vacancy|hiring|employ/.test(t)) return "job";
	return "grant";
}

function inferType(text: string): string {
	const t = text.toLowerCase();
	if (/fully funded/.test(t)) return "Fully funded";
	if (/partial/.test(t)) return "Partial funding";
	if (/paid/.test(t)) return "Paid";
	if (/stipend/.test(t)) return "Stipend included";
	if (/remote/.test(t)) return "Remote";
	if (/internship/.test(t)) return "Internship";
	if (/fellowship/.test(t)) return "Fellowship";
	if (/scholarship/.test(t)) return "Scholarship";
	if (/grant/.test(t)) return "Grant";
	return "";
}

// ── Focus-area tagger ──────────────────────────────────────────────────────

function tagFocusAreas(text: string): string[] {
	const lower = text.toLowerCase();
	const matched: string[] = [];
	for (const [area, keywords] of Object.entries(FOCUS_KEYWORDS)) {
		if (keywords.some((kw) => lower.includes(kw))) matched.push(area);
	}
	return matched;
}

// ── Deadline extractor ─────────────────────────────────────────────────────

function extractDeadline(text: string): string | null {
	const patterns = [
		/deadline[:\s–-]+([A-Za-z]+ \d{1,2},?\s*\d{4})/i,
		/deadline[:\s–-]+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
		/apply by[:\s]+([A-Za-z]+ \d{1,2},?\s*\d{4})/i,
		/closing date[:\s]+([A-Za-z]+ \d{1,2},?\s*\d{4})/i,
		/applications? (?:close|due)[:\s]+([A-Za-z]+ \d{1,2},?\s*\d{4})/i,
	];
	for (const pattern of patterns) {
		const m = text.match(pattern);
		if (m) return m[1].trim();
	}
	return null;
}

// ── Location extractor ─────────────────────────────────────────────────────

function extractLocation(text: string): string | null {
	const patterns = [
		/location[:\s]+([A-Za-z, ]+?)(?:\.|,|$|\n)/i,
		/based in ([A-Za-z, ]+?)(?:\.|,|\n|$)/i,
		/open to ([A-Za-z, ]+?) (?:students|applicants|citizens)/i,
	];
	const countries = [
		"worldwide",
		"global",
		"international",
		"remote",
		"online",
		"africa",
		"asia",
		"europe",
		"americas",
		"caribbean",
		"jamaica",
		"trinidad",
		"barbados",
		"guyana",
		"belize",
	];
	const lower = text.toLowerCase();
	for (const c of countries) {
		if (lower.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
	}
	for (const pattern of patterns) {
		const m = text.match(pattern);
		if (m) return m[1].trim();
	}
	return null;
}

// ── RSS parser ─────────────────────────────────────────────────────────────

type RSSItem = {
	title: string;
	link: string;
	description: string;
	pubDate: string;
	categories: string[];
};

function extractCDATA(block: string, tag: string): string {
	const cdata = block.match(
		new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
	);
	if (cdata) return cdata[1].trim();
	const plain = block.match(
		new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
	);
	return plain ? plain[1].replace(/<[^>]+>/g, "").trim() : "";
}

function extractLink(block: string): string {
	const atom = block.match(/href="(https?:\/\/[^"]+)"/i);
	if (atom) return atom[1];
	const linkTag = block.match(/<link[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/link>/i);
	if (linkTag) return linkTag[1];
	const guid = block.match(/<guid[^>]*>(https?:\/\/[^\s<]+)<\/guid>/i);
	if (guid) return guid[1];
	return "";
}

function parseRSS(xml: string): RSSItem[] {
	const items: RSSItem[] = [];
	const blocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
	for (const block of blocks) {
		const title = extractCDATA(block, "title");
		const link = extractLink(block);
		const description =
			extractCDATA(block, "content:encoded") ||
			extractCDATA(block, "description");
		const pubDate = extractCDATA(block, "pubDate");
		const catRegex =
			/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi;
		const categories: string[] = [];
		let m: RegExpExecArray | null = catRegex.exec(block);
		while (m !== null) {
			categories.push(m[1].trim());
			m = catRegex.exec(block);
		}
		if (title && link)
			items.push({ title, link, description, pubDate, categories });
	}
	return items;
}

// ── HTML entity decoder + strip ────────────────────────────────────────────

function decodeEntities(s: string): string {
	return s
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, " ");
}

function stripHtml(html: string): string {
	return decodeEntities(
		html
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim(),
	);
}

// ── Title cleaner ──────────────────────────────────────────────────────────
// RSS feeds from aggregator sites use long SEO blog titles like
// "DAAD Programme 2027 in Germany: Fully Funded Master's Scholarships for..."
// We take the part before the first colon when that makes the title shorter
// and still meaningful (≥ 20 chars), then cap at 120 chars.

function cleanTitle(raw: string): string {
	let t = decodeEntities(raw).trim();
	if (t.length > 80 && t.includes(":")) {
		const before = t.split(":")[0].trim();
		if (before.length >= 20) t = before;
	}
	return t.slice(0, 120);
}

// ── Org extractor ──────────────────────────────────────────────────────────
// Tries, in order:
//  1. A non-generic RSS category tag
//  2. "[Org] at [Institution]" → Institution
//  3. "[Institution] Opens/Announces/Awards/Calls/Launches/..."
//  4. "[Institution] Scholarship/Fellowship/Grant/Programme/Jobs/Fund..."
//  5. Falls back to "Various"

const GENERIC_CATS = new Set([
	"scholarship",
	"scholarships",
	"grant",
	"grants",
	"fellowship",
	"fellowships",
	"internship",
	"internships",
	"job",
	"jobs",
	"programme",
	"programs",
	"program",
	"africa",
	"asia",
	"europe",
	"americas",
	"global",
	"international",
	"funding",
	"opportunity",
	"opportunities",
	"news",
	"latest",
	"education",
	"career",
	"development",
	"youth",
	"student",
	"students",
	"research",
	"award",
	"awards",
]);

function extractOrg(rawTitle: string, categories: string[]): string {
	const orgCat = categories.find(
		(c) =>
			!GENERIC_CATS.has(c.toLowerCase().trim()) &&
			c.length > 3 &&
			c.length < 60,
	);
	if (orgCat) return orgCat;

	const title = decodeEntities(rawTitle);

	// "[Prog] at [University / Organisation] for/in/with/("
	const atMatch = title.match(
		/\bat\s+((?:University of\s+)?[A-Z][A-Za-z0-9\-/&'. ]{3,50}?)(?:\s+for\b|\s+in\b|\s+with\b|[,:(]|$)/,
	);
	if (atMatch) return atMatch[1].trim();

	// "[Org] Opens / Announces / Awards / Invites / Offers / Launches..."
	const verbMatch = title.match(
		/^((?:University of\s+)?[A-Z][A-Za-z0-9\-/&'. ]{2,55}?)\s+(?:Opens|Announces|Awards|Invites|Offers|Launches|Releases|Accepts|Calls|Provides|Grants|Funds|Recruits|Seeks|Begins|Supports)\b/,
	);
	if (verbMatch) return verbMatch[1].trim();

	// "[Org] Scholarship / Fellowship / Grant / Programme / Jobs / Fund / Award..."
	const typeMatch = title.match(
		/^((?:University of\s+)?[A-Z][A-Za-z0-9\-/&'. ]{2,55}?)\s+(?:Scholarship|Scholarships|Fellowship|Fellowships|Grant|Grants|Programme|Programs?|Jobs|Positions|Fund|Award|Research|Doctoral|PhD|Postdoc|Internship|Residency|Bursary|Accelerator|MBA|Master'?s|Bachelor)\b/,
	);
	if (typeMatch) return typeMatch[1].trim();

	return "Various";
}

// ── HTML scraping helpers ──────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string | null> {
	try {
		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; NorthApp/1.0; +https://gonorth.app)",
				Accept:
					"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			},
			signal: AbortSignal.timeout(15_000),
		});
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}

// Keywords that indicate an opportunity-related link
const OPP_LINK_KEYWORDS = [
	"scholarship",
	"bursary",
	"grant",
	"fellowship",
	"internship",
	"programme",
	"program",
	"fund",
	"award",
	"opportunity",
	"training",
	"job",
	"vacancy",
	"employment",
	"apprenticeship",
	"competition",
	"accelerator",
	"incubator",
	"pitch",
	"apply",
];

// Extract absolute links whose anchor text or href path contains an
// opportunity keyword, capped to avoid scraping entire sites.
function extractOpportunityLinks(
	html: string,
	baseUrl: string,
	limit = 20,
): string[] {
	const seen = new Set<string>();
	const links: string[] = [];
	const anchorRe = /<a[^>]+href=["']([^"'#?][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
	for (
		let m = anchorRe.exec(html);
		m !== null && links.length < limit;
		m = anchorRe.exec(html)
	) {
		const href = m[1].trim();
		const text = m[2]
			.replace(/<[^>]+>/g, "")
			.toLowerCase()
			.trim();
		const hrefLower = href.toLowerCase();
		if (
			!OPP_LINK_KEYWORDS.some((k) => text.includes(k) || hrefLower.includes(k))
		)
			continue;
		let abs = href;
		if (href.startsWith("/")) {
			try {
				abs = new URL(href, baseUrl).toString();
			} catch {
				continue;
			}
		} else if (!href.startsWith("http")) {
			continue;
		}
		if (!seen.has(abs)) {
			seen.add(abs);
			links.push(abs);
		}
	}
	return links;
}

type HtmlOpp = {
	title: string;
	description: string | null;
	url: string;
	category: string;
	deadline: string | null;
	location: string | null;
	focusTags: string[];
};

// Parse a single opportunity detail page into a normalised record.
function parseDetailPage(html: string, url: string): HtmlOpp | null {
	const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
	const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
	const rawTitle = stripHtml(h1?.[1] ?? h2?.[1] ?? "").trim();
	if (rawTitle.length < 6) return null;
	const title = rawTitle.slice(0, 255);

	// First substantive paragraph as description
	const parasRe = /<p[^>]*>([\s\S]{60,}?)<\/p>/gi;
	let description: string | null = null;
	for (let pm = parasRe.exec(html); pm !== null; pm = parasRe.exec(html)) {
		const t = stripHtml(pm[1]).trim();
		if (t.length > 60) {
			description = t.slice(0, 400);
			break;
		}
	}

	const fullText = `${title} ${description ?? ""}`;
	return {
		title,
		description,
		url,
		category: inferCategory(fullText),
		deadline: extractDeadline(description ?? ""),
		location: extractLocation(fullText),
		focusTags: tagFocusAreas(fullText),
	};
}

// ── MOF Jamaica scraper ────────────────────────────────────────────────────
//
// The Ministry of Finance Jamaica (mof.gov.jm) publishes the GOJ Scholarship
// Programme, bursaries, budget-linked SME/grant announcements, and social fund
// programmes. It has no RSS feed so we fetch known entry pages and follow
// opportunity-tagged links one level deep.

const MOF_ENTRY_PAGES = [
	"https://mof.gov.jm/scholarships-bursaries/",
	"https://mof.gov.jm/scholarships/",
	"https://mof.gov.jm/grants/",
	"https://mof.gov.jm/programmes/",
	"https://mof.gov.jm/news/",
	"https://mof.gov.jm/press-releases/",
	"https://mof.gov.jm/",
];

async function scrapeMofJamaica(): Promise<HtmlOpp[]> {
	const seenUrls = new Set<string>();
	const results: HtmlOpp[] = [];

	for (const entryUrl of MOF_ENTRY_PAGES) {
		const html = await fetchHtml(entryUrl);
		if (!html) continue;

		// Try parsing the entry page itself as a detail page (some pages are
		// standalone programme descriptions, not listings)
		const direct = parseDetailPage(html, entryUrl);
		if (direct && direct.title.length > 10 && !seenUrls.has(entryUrl)) {
			seenUrls.add(entryUrl);
			results.push(direct);
		}

		// Follow opportunity links found on the page
		const links = extractOpportunityLinks(html, "https://mof.gov.jm", 15);
		for (const link of links) {
			if (seenUrls.has(link) || !link.includes("mof.gov.jm")) continue;
			seenUrls.add(link);
			const detailHtml = await fetchHtml(link);
			if (!detailHtml) continue;
			const opp = parseDetailPage(detailHtml, link);
			if (opp) results.push(opp);
		}
	}

	return results;
}

// ── Generic HTML source scraper ────────────────────────────────────────────
// Used for HTML sources that don't need custom logic. Fetches the source's
// feed_url and follows up to 15 opportunity-tagged links one level deep.

async function scrapeGenericHtml(baseUrl: string): Promise<HtmlOpp[]> {
	const html = await fetchHtml(baseUrl);
	if (!html) return [];

	const seenUrls = new Set<string>([baseUrl]);
	const results: HtmlOpp[] = [];

	const origin = new URL(baseUrl).origin;
	const links = extractOpportunityLinks(html, origin, 15);

	for (const link of links) {
		if (seenUrls.has(link)) continue;
		seenUrls.add(link);
		const detailHtml = await fetchHtml(link);
		if (!detailHtml) continue;
		const opp = parseDetailPage(detailHtml, link);
		if (opp) results.push(opp);
	}

	return results;
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
	const secret = Deno.env.get("SCRAPE_SECRET");
	if (secret) {
		const header = req.headers.get("x-trigger-secret");
		if (header !== secret) {
			return new Response("Unauthorized", { status: 401 });
		}
	}

	const supabase = createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
	);

	const { data: sources, error: srcErr } = await supabase
		.from("scrape_sources")
		.select("id, name, feed_url, scrape_type, region")
		.eq("enabled", true);

	if (srcErr || !sources) {
		return new Response(JSON.stringify({ error: srcErr?.message }), {
			status: 500,
		});
	}

	const results: Record<string, unknown> = {};

	for (const source of sources) {
		const scrapeType = (source.scrape_type as string | null) ?? "rss";
		const region = (source.region as string | null) ?? null;

		// ── HTML sources ────────────────────────────────────────────────────
		if (scrapeType === "html") {
			let htmlOpps: HtmlOpp[] = [];
			try {
				if (source.id === "mof-jamaica") {
					htmlOpps = await scrapeMofJamaica();
				} else {
					htmlOpps = await scrapeGenericHtml(source.feed_url as string);
				}
			} catch (e) {
				results[source.id] = { added: 0, error: String(e) };
				continue;
			}

			let added = 0;
			for (const opp of htmlOpps.slice(0, 30)) {
				const { error } = await supabase.from("opportunities").insert({
					title: stripDashes(opp.title),
					org: source.name as string,
					category_id: opp.category,
					opportunity_type: opp.category,
					location: stripDashes(opp.location) ?? "Jamaica",
					deadline: stripDashes(opp.deadline),
					why: stripDashes(opp.description),
					tags: [],
					external_url: opp.url,
					focus_area_tags: opp.focusTags,
					region,
					source: source.id as string,
					source_id: opp.url,
					scraped_at: new Date().toISOString(),
					license_status: "cleared",
					attribution_text: source.name as string,
					published_at: new Date().toISOString(),
				});
				if (!error || error.code === "23505") {
					if (!error) added++;
				}
			}

			await supabase
				.from("scrape_sources")
				.update({ last_scraped_at: new Date().toISOString() })
				.eq("id", source.id);

			results[source.id] = { scraped: htmlOpps.length, added };
			continue;
		}

		// ── RSS sources (existing path) ─────────────────────────────────────
		let xml: string;
		try {
			const res = await fetch(source.feed_url as string, {
				headers: { "User-Agent": "NorthApp/1.0 (+https://gonorth.app)" },
				signal: AbortSignal.timeout(15_000),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			xml = await res.text();
		} catch (e) {
			results[source.id] = { added: 0, error: String(e) };
			continue;
		}

		const items = parseRSS(xml);
		let added = 0;
		const insertErrors: string[] = [];

		for (const item of items.slice(0, 30)) {
			const plain = stripHtml(item.description);
			const fullText = `${item.title} ${plain} ${item.categories.join(" ")}`;

			const focusAreaTags = tagFocusAreas(fullText);
			const opportunityType = inferType(fullText);
			const categoryId = inferCategory(fullText);
			const deadline = extractDeadline(plain);
			const location = extractLocation(`${item.title} ${plain}`);
			const org = extractOrg(item.title, item.categories);
			const title = cleanTitle(item.title);
			const why =
				plain.length > 220 ? `${plain.slice(0, 217)}…` : plain || null;

			const { error } = await supabase.from("opportunities").insert({
				title: stripDashes(title),
				org: stripDashes(org.slice(0, 120)),
				category_id: categoryId,
				opportunity_type: opportunityType || null,
				location: stripDashes(location),
				deadline: stripDashes(deadline),
				why: stripDashes(why),
				tags: item.categories.slice(0, 6),
				external_url: item.link,
				focus_area_tags: focusAreaTags,
				region,
				source: source.id as string,
				source_id: item.link,
				scraped_at: new Date().toISOString(),
				license_status: "cleared",
				attribution_text: source.name as string,
				published_at: item.pubDate
					? new Date(item.pubDate).toISOString()
					: new Date().toISOString(),
			});

			if (error) {
				if (error.code !== "23505") insertErrors.push(error.message);
			} else {
				added++;
			}
		}

		await supabase
			.from("scrape_sources")
			.update({ last_scraped_at: new Date().toISOString() })
			.eq("id", source.id);

		results[source.id] = {
			parsed: items.length,
			added,
			...(insertErrors.length
				? { insertErrors: insertErrors.slice(0, 3) }
				: {}),
		};
	}

	return new Response(JSON.stringify({ ok: true, results }), {
		headers: { "content-type": "application/json" },
	});
});
