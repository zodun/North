// Edge Function: plan-month (MONTH-02)
// Accepts a user's self-written monthly goal + cadence, calls Claude to break
// it into a 4-week plan (milestone + daily action per week), then rewrites the
// month's mission and steps to match — marking the goal as user-authored.
//
// Auth: user JWT via Authorization header (supabase.functions.invoke sends it
// automatically). An authenticated client verifies identity and reads context;
// the service role writes the mission, steps and cadence (those rows aren't
// freely client-writable).
//
// Operator setup (once per environment):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy plan-month

import { createClient } from "@supabase/supabase-js";
import { corsHeaders, preflight } from "../_shared/cors.ts";

import { captureServer } from "../_shared/posthog.ts";
import { escapeHtml, sendMessage, telegramToken } from "../_shared/telegram.ts";
import { stripDashes } from "../_shared/text.ts";
import {
	buildSuggestPrompt,
	buildUserPrompt,
	DAYS_PER_WEEK,
	fallbackPlan,
	type GoalSuggestion,
	MODEL_NAME,
	PLAN_TOOL,
	type PlanResult,
	PROMPT_VERSION,
	SUGGEST_SYSTEM_PROMPT,
	SUGGEST_TOOL,
	SYSTEM_PROMPT,
} from "./prompt.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_TITLE_LENGTH = 140;
const MAX_INTENT_LENGTH = 400;

type Step = {
	id: string;
	cadence: "daily" | "weekly";
	week_index: number;
	due_date: string | null;
	title: string;
	detail: string | null;
	estimate_label: string | null;
	done: boolean;
};

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

// Every calendar day of the month that month_start belongs to.
function monthDays(monthStart: string): string[] {
	const start = new Date(`${monthStart}T00:00:00Z`);
	const year = start.getUTCFullYear();
	const month = start.getUTCMonth();
	const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	const days: string[] = [];
	for (let d = 1; d <= lastDay; d++) {
		days.push(`${year}-${pad(month + 1)}-${pad(d)}`);
	}
	return days;
}

if (typeof Deno !== "undefined" && Deno.env.get("DENO_TESTING") !== "1") {
	Deno.serve(async (req: Request) => {
		const pf = preflight(req);
		if (pf) return pf;
		// ── Auth ─────────────────────────────────────────────────────────
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
		let mode: "suggest" | "plan";
		let goalTitle = "";
		let goalIntent = "";
		let cadence: "daily" | "weekly" = "daily";
		let monthStart: string;
		try {
			const parsed = (await req.json()) as {
				mode?: unknown;
				goal_title?: unknown;
				goal_intent?: unknown;
				cadence?: unknown;
				month_start?: unknown;
			};
			if (
				typeof parsed.month_start !== "string" ||
				!/^\d{4}-\d{2}-\d{2}$/.test(parsed.month_start)
			) {
				return json({ error: "month_start is required (YYYY-MM-DD)" }, 400);
			}
			monthStart = parsed.month_start;
			mode = parsed.mode === "suggest" ? "suggest" : "plan";
			if (mode === "plan") {
				if (
					typeof parsed.goal_title !== "string" ||
					parsed.goal_title.trim().length === 0
				) {
					return json({ error: "goal_title is required" }, 400);
				}
				goalTitle = parsed.goal_title.trim().slice(0, MAX_TITLE_LENGTH);
				goalIntent =
					typeof parsed.goal_intent === "string"
						? parsed.goal_intent.trim().slice(0, MAX_INTENT_LENGTH)
						: "";
				cadence = parsed.cadence === "weekly" ? "weekly" : "daily";
			}
		} catch {
			return json({ error: "invalid JSON" }, 400);
		}

		// ── Suggest mode: propose a goal from the user's onboarding, no writes ─
		if (mode === "suggest") {
			const [focusRes, profileRes] = await Promise.all([
				userClient
					.from("user_focus_areas")
					.select("focus_areas(label)")
					.eq("user_id", user.id),
				userClient
					.from("profiles")
					.select(
						"statement_of_intent, season_label, preferred_opportunity_categories",
					)
					.eq("user_id", user.id)
					.maybeSingle<{
						statement_of_intent: string | null;
						season_label: string | null;
						preferred_opportunity_categories: string[] | null;
					}>(),
			]);

			const focusLabels = (
				(focusRes.data ?? []) as { focus_areas: { label: string } | null }[]
			)
				.map((r) => r.focus_areas?.label)
				.filter((l): l is string => Boolean(l));

			let suggestion: GoalSuggestion = { goal_title: "", goal_intent: "" };
			if (anthropicKey) {
				try {
					suggestion = (await callClaudeJson(
						anthropicKey,
						SUGGEST_SYSTEM_PROMPT,
						buildSuggestPrompt({
							focus_areas: focusLabels,
							statement_of_intent: profileRes.data?.statement_of_intent ?? "",
							season_label: profileRes.data?.season_label ?? "",
							interests:
								profileRes.data?.preferred_opportunity_categories ?? [],
						}),
						SUGGEST_TOOL,
						512,
					)) as GoalSuggestion;
				} catch {
					// fall through to the template fallback below
				}
			}
			if (!suggestion.goal_title) {
				// Fall back to this month's seeded template goal so the field is
				// never empty even without an API key.
				const { data: m } = await userClient
					.from("monthly_missions")
					.select("goal_title")
					.eq("user_id", user.id)
					.eq("month_start", monthStart)
					.maybeSingle<{ goal_title: string }>();
				suggestion = {
					goal_title: m?.goal_title ?? "Make one meaningful step this month.",
					goal_intent: "",
				};
			}
			return json({ ok: true, suggestion });
		}

		// ── Context: focus areas + the mission row we're rewriting ───────
		const [focusRes, missionRes, profileRes] = await Promise.all([
			userClient
				.from("user_focus_areas")
				.select("focus_areas(label)")
				.eq("user_id", user.id),
			userClient
				.from("monthly_missions")
				.select("id, focus_area_id")
				.eq("user_id", user.id)
				.eq("month_start", monthStart)
				.maybeSingle<{ id: string; focus_area_id: string | null }>(),
			userClient
				.from("profiles")
				.select(
					"time_budget_label, career_stage, fields, country, telegram_chat_id, telegram_opt_in",
				)
				.eq("user_id", user.id)
				.maybeSingle<{
					time_budget_label: string | null;
					career_stage: string | null;
					fields: string[] | null;
					country: string | null;
					telegram_chat_id: string | null;
					telegram_opt_in: boolean | null;
				}>(),
		]);

		if (!missionRes.data) {
			return json({ error: "no mission for that month" }, 404);
		}
		const missionId = missionRes.data.id;
		const focusAreaId = missionRes.data.focus_area_id;
		const estimate = profileRes.data?.time_budget_label || "10 minutes";

		const focusAreas = (
			(focusRes.data ?? []) as { focus_areas: { label: string } | null }[]
		)
			.map((r) => r.focus_areas?.label)
			.filter((l): l is string => Boolean(l));

		// ── Build the plan (Claude, with a deterministic fallback) ───────
		let plan: PlanResult;
		let usedAi = false;
		if (!anthropicKey) {
			plan = fallbackPlan(goalTitle);
		} else {
			try {
				const result = (await callClaudeJson(
					anthropicKey,
					SYSTEM_PROMPT,
					buildUserPrompt({
						goal_title: goalTitle,
						goal_intent: goalIntent,
						focus_areas: focusAreas,
						career_stage: profileRes.data?.career_stage ?? undefined,
						fields: profileRes.data?.fields ?? undefined,
						region: profileRes.data?.country ?? undefined,
					}),
					PLAN_TOOL,
					2048,
				)) as PlanResult;
				if (!Array.isArray(result.weeks) || result.weeks.length !== 4) {
					throw new Error("plan did not contain 4 weeks");
				}
				if (
					result.weeks.some(
						(wk) =>
							!Array.isArray(wk.daily_actions) || wk.daily_actions.length === 0,
					)
				) {
					throw new Error("plan week missing daily_actions");
				}
				plan = result;
				usedAi = true;
			} catch {
				plan = fallbackPlan(goalTitle);
			}
		}

		// Keep all generated copy dash-free (mirrors migration 0053).
		goalTitle = stripDashes(goalTitle);
		goalIntent = stripDashes(goalIntent);
		for (const wk of plan.weeks) {
			wk.milestone = stripDashes(wk.milestone);
			wk.summary = stripDashes(wk.summary ?? "");
			wk.daily_actions = (wk.daily_actions ?? []).map(stripDashes);
		}

		// ── Rewrite mission + steps with the service role ────────────────
		const service = createClient(supabaseUrl, serviceRole, {
			auth: { persistSession: false, autoRefreshToken: false },
		});

		await service
			.from("monthly_missions")
			.update({
				goal_title: goalTitle,
				goal_intent: goalIntent || null,
				generated_by: "manual",
			})
			.eq("id", missionId);

		await service
			.from("profiles")
			.update({ mission_cadence: cadence })
			.eq("user_id", user.id);

		// Replace the whole step set so daily + weekly both reflect the new plan.
		await service
			.from("monthly_mission_steps")
			.delete()
			.eq("monthly_mission_id", missionId);

		const rows: Array<Record<string, unknown>> = [];
		// 4 weekly milestones.
		for (let w = 0; w < 4; w++) {
			rows.push({
				monthly_mission_id: missionId,
				user_id: user.id,
				cadence: "weekly",
				week_index: w,
				due_date: null,
				title: plan.weeks[w].milestone,
				detail: plan.weeks[w].summary || `Your focus for week ${w + 1}.`,
				estimate_label: "This week",
				sort_order: w,
			});
		}
		// Lay the 4-week arc onto the days REMAINING in the month, starting today.
		// Setting a goal mid-month then gives a real first step TODAY (week 1,
		// action 1) and still reaches the finish by month-end — instead of
		// stranding the opening steps on past dates and dropping the user into the
		// middle of the arc. When the goal is set on the 1st, this is the whole
		// month, unchanged.
		const todayIso = new Date().toISOString().slice(0, 10);
		const firstDay = monthStart > todayIso ? monthStart : todayIso;
		const days = monthDays(monthStart).filter((d) => d >= firstDay);
		days.forEach((due, offset) => {
			// Progress through the remaining span: 0 today → ~1 at month end.
			const p = days.length <= 1 ? 0 : offset / days.length;
			const w = Math.min(3, Math.floor(p * 4));
			const actions = plan.weeks[w].daily_actions;
			// Sequential step within the week, proportional to position in its slice.
			const within = Math.floor((p * 4 - w) * DAYS_PER_WEEK);
			const idx = Math.min(actions.length - 1, Math.max(0, within));
			const dayTask =
				actions.length > 0 ? actions[idx] : plan.weeks[w].milestone;
			rows.push({
				monthly_mission_id: missionId,
				user_id: user.id,
				cadence: "daily",
				week_index: w,
				due_date: due,
				title: dayTask,
				detail: plan.weeks[w].milestone,
				estimate_label: estimate,
				sort_order: offset,
			});
		});

		await service.from("monthly_mission_steps").insert(rows);

		// Read the steps back in the same shape the client view expects.
		const { data: steps } = await service
			.from("monthly_mission_steps")
			.select(
				"id, cadence, week_index, due_date, title, detail, estimate_label, done",
			)
			.eq("monthly_mission_id", missionId)
			.order("sort_order");

		await captureServer("monthly_goal_set", user.id, {
			month_start: monthStart,
			cadence,
			focus_area_id: focusAreaId,
			used_ai: usedAi,
			prompt_version: PROMPT_VERSION,
		});

		// Goal-set confirmation on Telegram (NOTIF-03) — a one-time kickoff message
		// separate from the daily/weekly reminder cron. Only for connected,
		// opted-in users; weekly users get this week's focus, daily users get their
		// first step. Best-effort: a send failure never fails the goal-set.
		const tgChatId = profileRes.data?.telegram_chat_id;
		const tgToken = telegramToken();
		if (tgChatId && profileRes.data?.telegram_opt_in && tgToken) {
			const focus =
				cadence === "weekly"
					? `This week: ${plan.weeks[0]?.milestone ?? ""}\n${
							plan.weeks[0]?.summary ?? ""
						}`
					: `Your first step today: ${
							plan.weeks[0]?.daily_actions?.[0] ??
							plan.weeks[0]?.milestone ??
							""
						}`;
			const text =
				`🎯 Your goal is set:\n<b>${escapeHtml(goalTitle)}</b>\n\n` +
				`${escapeHtml(focus)}\n\n` +
				`I'll send your reminder here each ${cadence === "weekly" ? "week" : "morning"}. Turn it off any time in Profile.`;
			await sendMessage(tgToken, tgChatId, text);
		}

		return json({
			ok: true,
			mission: {
				id: missionId,
				goal_title: goalTitle,
				goal_intent: goalIntent || null,
				focus_area_id: focusAreaId,
				month_start: monthStart,
				generated_by: "manual",
			},
			cadence,
			steps: (steps ?? []) as Step[],
		});
	});
}

// Single-shot Claude call that returns structured JSON. The Messages API has no
// response_format, so we force a tool call (tool_choice) and read the matching
// tool_use block's `input`. Throws on any failure so callers can fall back.
async function callClaudeJson(
	apiKey: string,
	system: string,
	userContent: string,
	tool: { name: string },
	maxTokens: number,
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
			max_tokens: maxTokens,
			system,
			messages: [{ role: "user", content: userContent }],
			tools: [tool],
			tool_choice: { type: "tool", name: tool.name },
		}),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
	}
	const data = (await res.json()) as {
		content?: { type: string; name?: string; input?: unknown }[];
	};
	const block = (data.content ?? []).find((b) => b.type === "tool_use");
	if (!block?.input) throw new Error("no tool_use block in Claude response");
	return block.input;
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...corsHeaders },
	});
}
