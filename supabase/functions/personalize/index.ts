// Edge Function: personalize (AI-07, premium)
// Ranks a user's For You feed or Opportunities with Claude and writes a short
// reason for the top picks. Premium-only (public.is_premium) and cached once
// per user per surface per day in public.user_personalization.
//
// The page passes candidate items as { id, label }; the function loads the
// user's context, asks Claude to order the items (by index) + highlight the top
// ~8, then returns ranking [{ id, why }] best-first. Falls back to the original
// order on any failure, so the page never blocks on AI.
//
// Operator setup:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy personalize

import { createClient } from "@supabase/supabase-js";

import { captureServer } from "../_shared/posthog.ts";
import {
	buildUserPrompt,
	MODEL_NAME,
	type PersonalizeContext,
	PROMPT_VERSION,
	RANKING_TOOL,
	type RankingResult,
	systemPrompt,
} from "./prompt.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_ITEMS = 80;
const MAX_LABEL = 160;

type Item = { id: string; label: string };
type Ranked = { id: string; why: string };

if (typeof Deno !== "undefined" && Deno.env.get("DENO_TESTING") !== "1") {
	Deno.serve(async (req: Request) => {
		const authHeader = req.headers.get("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return json({ error: "missing authorization" }, 401);
		}
		const jwt = authHeader.slice(7);

		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
		if (!supabaseUrl || !serviceRole) {
			return json({ error: "missing env" }, 500);
		}

		const userClient = createClient(
			supabaseUrl,
			Deno.env.get("SUPABASE_ANON_KEY") ?? "",
			{
				global: { headers: { Authorization: `Bearer ${jwt}` } },
				auth: { persistSession: false, autoRefreshToken: false },
			},
		);
		const {
			data: { user },
			error: authErr,
		} = await userClient.auth.getUser();
		if (authErr || !user) {
			return json({ error: "unauthorized" }, 401);
		}

		// ── Parse body ───────────────────────────────────────────────────
		let surface: "feed" | "opportunities";
		let day: string;
		let items: Item[];
		try {
			const parsed = (await req.json()) as {
				surface?: unknown;
				day?: unknown;
				items?: unknown;
			};
			if (parsed.surface !== "feed" && parsed.surface !== "opportunities") {
				return json({ error: "surface must be feed|opportunities" }, 400);
			}
			if (
				typeof parsed.day !== "string" ||
				!/^\d{4}-\d{2}-\d{2}$/.test(parsed.day)
			) {
				return json({ error: "day is required (YYYY-MM-DD)" }, 400);
			}
			if (!Array.isArray(parsed.items)) {
				return json({ error: "items must be an array" }, 400);
			}
			surface = parsed.surface;
			day = parsed.day;
			items = parsed.items
				.filter(
					(i): i is Item =>
						!!i &&
						typeof (i as Item).id === "string" &&
						typeof (i as Item).label === "string",
				)
				.slice(0, MAX_ITEMS)
				.map((i) => ({ id: i.id, label: i.label.slice(0, MAX_LABEL) }));
		} catch {
			return json({ error: "invalid JSON" }, 400);
		}

		if (items.length === 0) return json({ ok: true, ranking: [] });

		// Note: no premium gate here. Free users get ranked too so the page can
		// show a one-pick preview that drives upgrades; the per-day cache below
		// bounds this to a single Claude call per user per surface per day, and
		// the pages decide how much of the ranking to reveal.

		// ── Cache: one ranking per user/surface/day ──────────────────────
		const { data: cached } = await userClient
			.from("user_personalization")
			.select("ranking")
			.eq("user_id", user.id)
			.eq("surface", surface)
			.eq("day", day)
			.maybeSingle<{ ranking: Ranked[] }>();
		if (cached?.ranking) {
			return json({ ok: true, ranking: cached.ranking, cached: true });
		}

		// ── Context ──────────────────────────────────────────────────────
		const monthStart = `${day.slice(0, 7)}-01`;
		const [focusRes, profileRes, missionRes] = await Promise.all([
			userClient
				.from("user_focus_areas")
				.select("focus_areas(label)")
				.eq("user_id", user.id),
			userClient
				.from("profiles")
				.select(
					"statement_of_intent, season_label, preferred_opportunity_categories, career_stage, fields, country, open_to_remote, open_to_relocate",
				)
				.eq("user_id", user.id)
				.maybeSingle<{
					statement_of_intent: string | null;
					season_label: string | null;
					preferred_opportunity_categories: string[] | null;
					career_stage: string | null;
					fields: string[] | null;
					country: string | null;
					open_to_remote: boolean | null;
					open_to_relocate: boolean | null;
				}>(),
			userClient
				.from("monthly_missions")
				.select("goal_title")
				.eq("user_id", user.id)
				.eq("month_start", monthStart)
				.maybeSingle<{ goal_title: string }>(),
		]);

		const ctx: PersonalizeContext = {
			focus_areas: (
				(focusRes.data ?? []) as { focus_areas: { label: string } | null }[]
			)
				.map((r) => r.focus_areas?.label)
				.filter((l): l is string => Boolean(l)),
			statement_of_intent: profileRes.data?.statement_of_intent ?? "",
			season_label: profileRes.data?.season_label ?? "",
			goal_title: missionRes.data?.goal_title ?? "",
			interests: profileRes.data?.preferred_opportunity_categories ?? [],
			career_stage: profileRes.data?.career_stage ?? "",
			fields: profileRes.data?.fields ?? [],
			country: profileRes.data?.country ?? "",
			open_to_remote: profileRes.data?.open_to_remote ?? false,
			open_to_relocate: profileRes.data?.open_to_relocate ?? false,
		};

		// ── Rank with Claude (fallback = original order, uncached) ───────
		let ranking: Ranked[] | null = null;
		let usedAi = false;
		if (anthropicKey) {
			try {
				const result = (await callClaude(
					anthropicKey,
					systemPrompt(surface),
					buildUserPrompt(
						ctx,
						items.map((i) => i.label),
					),
				)) as RankingResult;
				ranking = applyRanking(items, result);
				usedAi = true;
			} catch {
				ranking = null;
			}
		}

		if (!ranking) {
			// No AI — return original order without caching, so we retry later.
			return json({
				ok: true,
				ranking: items.map((i) => ({ id: i.id, why: "" })),
			});
		}

		// ── Cache (service role) ─────────────────────────────────────────
		const service = createClient(supabaseUrl, serviceRole, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
		await service
			.from("user_personalization")
			.upsert(
				{ user_id: user.id, surface, day, ranking },
				{ onConflict: "user_id,surface,day" },
			);

		await captureServer("personalized", user.id, {
			surface,
			items: items.length,
			used_ai: usedAi,
			prompt_version: PROMPT_VERSION,
		});

		return json({ ok: true, ranking });
	});
}

// Turn the model's index ordering + highlights into ranked {id, why}. Indices
// are validated against range; any item the model dropped is appended at the
// end so nothing is lost.
function applyRanking(items: Item[], result: RankingResult): Ranked[] {
	const why = new Map<number, string>();
	for (const h of result.highlights ?? []) {
		if (Number.isInteger(h.item) && typeof h.reason === "string") {
			why.set(h.item, h.reason.trim());
		}
	}
	const seen = new Set<number>();
	const ranked: Ranked[] = [];
	for (const n of result.order ?? []) {
		if (!Number.isInteger(n) || n < 1 || n > items.length || seen.has(n))
			continue;
		seen.add(n);
		const item = items[n - 1];
		ranked.push({ id: item.id, why: why.get(n) ?? "" });
	}
	// Append anything the model omitted, in original order.
	items.forEach((item, idx) => {
		if (!seen.has(idx + 1)) ranked.push({ id: item.id, why: "" });
	});
	return ranked;
}

async function callClaude(
	apiKey: string,
	system: string,
	userContent: string,
): Promise<unknown> {
	const res = await fetch(ANTHROPIC_URL, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-api-key": apiKey,
			"anthropic-version": ANTHROPIC_VERSION,
		},
		body: JSON.stringify({
			model: MODEL_NAME,
			max_tokens: 1200,
			system,
			messages: [{ role: "user", content: userContent }],
			tools: [RANKING_TOOL],
			tool_choice: { type: "tool", name: RANKING_TOOL.name },
		}),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
	}
	const data = (await res.json()) as {
		content?: { type: string; input?: unknown }[];
	};
	const block = (data.content ?? []).find((b) => b.type === "tool_use");
	if (!block?.input) throw new Error("no tool_use block in response");
	return block.input;
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}
