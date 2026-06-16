// Edge Function: fill-article-images
//
// Backfills a cover image for every shown content_item that has none, so both
// the web feed AND the native app (which reads thumbnail_url directly) always
// have an image. Mirrors the web cascade in lib/article-image:
//
//   Tier A  AI cover (gated), external text-to-image model renders it,
//                                     Cloudinary is the sink (TODO below). NB:
//                                     Cloudinary has no from-scratch text-to-image.
//   Tier B  Deterministic cover, zero-cost /api/cover SVG. Always succeeds.
//
// Idempotent: only rows with an empty thumbnail_url are touched, so re-runs are
// cheap and safe. Paid generation is budget-capped per run.
//
// Triggered nightly by pg_cron via net.http_post (see the cron migration). Can
// also be POSTed { "limit": N } to backfill a bounded batch on demand.

import { createClient } from "@supabase/supabase-js";

type Row = {
	id: string;
	eyebrow: string | null;
	content_category_id: string | null;
};

type RunResult = {
	scanned: number;
	filled: number;
	generated: number;
	errors: string[];
};

// ── Deterministic cover URL (mirrors lib/article-image/cover) ────────────────
function coverCatKey(label: string | null): string {
	const l = (label ?? "").toLowerCase();
	if (/(mind|mental|wellbeing|purpose|mindset)/.test(l)) return "mindset";
	if (/(money|financ|wealth|invest)/.test(l)) return "money";
	if (/(skill|learn|craft|study)/.test(l)) return "skills";
	if (/(health|fitness|body|wellness)/.test(l)) return "health";
	return "career";
}
function hash(s: string): number {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}
// Absolute on purpose: the value is stored in the DB and read by native (needs a
// full URL) as well as web. Web routes it through /api/img harmlessly.
function coverUrl(base: string, row: Row): string {
	const cat = coverCatKey(row.eyebrow ?? row.content_category_id);
	const seed = (hash(row.id) % 100000).toString();
	return `${base.replace(/\/$/, "")}/api/cover?cat=${cat}&seed=${seed}`;
}

async function run(
	db: ReturnType<typeof createClient>,
	appBase: string,
	limit: number,
): Promise<RunResult> {
	const result: RunResult = {
		scanned: 0,
		filled: 0,
		generated: 0,
		errors: [],
	};

	const { data, error } = await db
		.from("content_items")
		.select("id, eyebrow, content_category_id")
		.neq("license_status", "blocked")
		.or("thumbnail_url.is.null,thumbnail_url.eq.")
		.limit(limit);
	if (error) {
		result.errors.push(`query: ${error.message}`);
		return result;
	}

	const rows = (data ?? []) as Row[];
	result.scanned = rows.length;

	// Paid-generation budget for this run (Tier A). Deterministic covers (Tier B)
	// are free and uncapped.
	const genEnabled = Deno.env.get("ARTICLE_IMAGE_GEN") === "1";
	const genBudget = genEnabled
		? Number.parseInt(Deno.env.get("ARTICLE_IMAGE_GEN_BUDGET") ?? "20", 10)
		: 0;

	for (const row of rows) {
		let url: string | null = null;

		// Tier A, AI cover (gated). TODO(article-image): Claude concept prompt →
		// external text-to-image model → Cloudinary upload (sink) → Claude vision
		// QA; on success set url to the secure_url and decrement genBudget.
		if (genEnabled && genBudget > 0) {
			// url = await generateCloudinaryCover(row); if (url) genBudget--; …
		}

		// Tier B, deterministic cover (always succeeds).
		if (!url) url = coverUrl(appBase, row);

		const { error: upErr } = await db
			.from("content_items")
			.update({ thumbnail_url: url, updated_at: new Date().toISOString() })
			.eq("id", row.id);
		if (upErr) {
			result.errors.push(`${row.id}: ${upErr.message}`);
			continue;
		}
		result.filled++;
		if (url.includes("/api/cover")) {
			// deterministic
		} else {
			result.generated++;
		}
	}
	void genBudget;
	return result;
}

if (typeof Deno !== "undefined" && Deno.env.get("DENO_TESTING") !== "1") {
	Deno.serve(async (req: Request) => {
		const expectedSecret = Deno.env.get("ARTICLE_IMAGE_TRIGGER_SECRET");
		const got = req.headers.get("x-trigger-secret");
		if (!expectedSecret || got !== expectedSecret) {
			return new Response(JSON.stringify({ error: "unauthorized" }), {
				status: 401,
				headers: { "content-type": "application/json" },
			});
		}

		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		const appBase =
			Deno.env.get("APP_BASE_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL");
		if (!supabaseUrl || !serviceRole || !appBase) {
			return new Response(
				JSON.stringify({
					error: "missing SUPABASE_URL / service role / APP_BASE_URL",
				}),
				{ status: 500, headers: { "content-type": "application/json" } },
			);
		}

		let limit = 200;
		try {
			const body = await req.json();
			if (typeof body?.limit === "number") limit = Math.min(1000, body.limit);
		} catch {
			// no body → default batch
		}

		const db = createClient(supabaseUrl, serviceRole, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
		const result = await run(db, appBase, limit);
		return new Response(JSON.stringify(result), {
			headers: { "content-type": "application/json" },
		});
	});
}

export { coverCatKey, coverUrl, run };
