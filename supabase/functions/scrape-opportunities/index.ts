// Edge Function: scrape-opportunities
//
// Fetches RSS feeds from global opportunity banks, normalises each item
// into the public.opportunities schema, tags it with focus areas, and
// upserts into Supabase.  Called daily at 06:00 UTC by pg_cron.
//
// Environment secrets required:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SCRAPE_SECRET (optional auth)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
		if (keywords.some((kw) => lower.includes(kw))) {
			matched.push(area);
		}
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

// ── RSS parser (regex-based, no XML lib needed in Deno) ───────────────────

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
	// Atom-style href
	const atom = block.match(/href="(https?:\/\/[^"]+)"/i);
	if (atom) return atom[1];
	// RSS <link> — may be plain text between tags
	const linkTag = block.match(/<link[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/link>/i);
	if (linkTag) return linkTag[1];
	// Guid with URL
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

		// All <category> occurrences
		const catRegex =
			/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi;
		const categories: string[] = [];
		let m: RegExpExecArray | null = catRegex.exec(block);
		while (m !== null) {
			categories.push(m[1].trim());
			m = catRegex.exec(block);
		}

		if (title && link) {
			items.push({ title, link, description, pubDate, categories });
		}
	}
	return items;
}

// ── Strip HTML ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
	return html
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/\s+/g, " ")
		.trim();
}

// ── Org extractor ──────────────────────────────────────────────────────────

function extractOrg(title: string, categories: string[]): string {
	if (categories.length > 0) return categories[0];
	const m = title.match(
		/(?:by|from|–|—|-)\s*([A-Z][^–—|\n]{2,40}?)(?:\s*[|–—]|\s*$)/,
	);
	return m ? m[1].trim() : "Various";
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
	// Optional secret check (set SCRAPE_SECRET env + app.scrape_secret Postgres setting)
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

	// Load enabled sources
	const { data: sources, error: srcErr } = await supabase
		.from("scrape_sources")
		.select("id, name, feed_url")
		.eq("enabled", true);

	if (srcErr || !sources) {
		return new Response(JSON.stringify({ error: srcErr?.message }), {
			status: 500,
		});
	}

	const results: Record<string, { added: number; error?: string }> = {};

	for (const source of sources) {
		let xml: string;
		try {
			const res = await fetch(source.feed_url, {
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
			const fullText =
				item.title + " " + plain + " " + item.categories.join(" ");

			const focusAreaTags = tagFocusAreas(fullText);
			const opportunityType = inferType(fullText);
			const categoryId = inferCategory(fullText);
			const deadline = extractDeadline(plain);
			const location = extractLocation(plain);
			const org = extractOrg(item.title, item.categories);
			const why =
				plain.length > 220 ? plain.slice(0, 217) + "…" : plain || null;

			const { error } = await supabase.from("opportunities").insert({
				title: item.title.slice(0, 255),
				org: org.slice(0, 120),
				category_id: categoryId,
				opportunity_type: opportunityType || null,
				location: location,
				deadline: deadline,
				why: why,
				tags: item.categories.slice(0, 6),
				external_url: item.link,
				focus_area_tags: focusAreaTags,
				source: source.id,
				source_id: item.link,
				scraped_at: new Date().toISOString(),
				license_status: "cleared",
				attribution_text: source.name,
				published_at: item.pubDate
					? new Date(item.pubDate).toISOString()
					: new Date().toISOString(),
			});

			if (error) {
				// 23505 = unique_violation — item already exists, not a real error
				if (error.code !== "23505") insertErrors.push(error.message);
			} else {
				added++;
			}
		}

		// Update scrape_sources metadata
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
