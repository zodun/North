// Edge Function: reflect (AI-06)
// Accepts a user's weekly free-text reflection, calls OpenAI to extract
// themes + alignment signal + mission nudge, writes the analysis back to
// user_reflections, and returns the result to the client immediately.
//
// Auth: user JWT via Authorization header (supabase.functions.invoke sends it
// automatically). The function creates an authenticated client from the JWT to
// verify identity and read focus areas; it uses the service role to write
// analyzed_at + analysis back (client RLS allows insert but not update).
//
// Operator setup (once per environment):
//   supabase secrets set OPENAI_API_KEY=sk-...
//   supabase functions deploy reflect

import { createClient } from "@supabase/supabase-js";

import { captureServer } from "../_shared/posthog.ts";
import {
	buildUserPrompt,
	MODEL_NAME,
	PROMPT_VERSION,
	RESPONSE_SCHEMA,
	type ReflectionAnalysis,
	type ReflectPayload,
	SYSTEM_PROMPT,
} from "./prompt.ts";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_BODY_LENGTH = 1000;

if (typeof Deno !== "undefined" && Deno.env.get("DENO_TESTING") !== "1") {
	Deno.serve(async (req: Request) => {
		// ── Auth ─────────────────────────────────────────────────────────
		const authHeader = req.headers.get("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return json({ error: "missing authorization" }, 401);
		}
		const jwt = authHeader.slice(7);

		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		const openaiKey = Deno.env.get("OPENAI_API_KEY");
		if (!supabaseUrl || !serviceRole) {
			return json({ error: "missing env" }, 500);
		}

		// Authenticated client to verify the user and read their data.
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
		let body: string;
		let weekEnding: string | undefined;
		try {
			const parsed = (await req.json()) as {
				body?: unknown;
				week_ending?: unknown;
			};
			if (typeof parsed.body !== "string" || parsed.body.trim().length === 0) {
				return json({ error: "body is required" }, 400);
			}
			body = parsed.body.trim().slice(0, MAX_BODY_LENGTH);
			weekEnding =
				typeof parsed.week_ending === "string" ? parsed.week_ending : undefined;
		} catch {
			return json({ error: "invalid JSON" }, 400);
		}

		// ── Derive week_ending if not provided ───────────────────────────
		// Use the most recent signal_scores row's week_ending, or today as fallback.
		if (!weekEnding) {
			const { data: scoreRow } = await userClient
				.from("signal_scores")
				.select("week_ending")
				.eq("user_id", user.id)
				.order("week_ending", { ascending: false })
				.limit(1)
				.maybeSingle<{ week_ending: string }>();
			weekEnding =
				scoreRow?.week_ending ?? new Date().toISOString().slice(0, 10);
		}

		// ── Fetch context for the prompt ─────────────────────────────────
		const [focusRes, scoreRes] = await Promise.all([
			userClient
				.from("user_focus_areas")
				.select("focus_areas(label)")
				.eq("user_id", user.id),
			userClient
				.from("signal_scores")
				.select("band, provisional")
				.eq("user_id", user.id)
				.eq("week_ending", weekEnding)
				.maybeSingle<{ band: string; provisional: boolean }>(),
		]);

		const focusAreas = (
			(focusRes.data ?? []) as { focus_areas: { label: string } | null }[]
		)
			.map((r) => r.focus_areas?.label)
			.filter((l): l is string => Boolean(l));

		// ── Insert reflection row (client identity) ──────────────────────
		const { data: reflection, error: insertErr } = await userClient
			.from("user_reflections")
			.insert({ user_id: user.id, week_ending: weekEnding, body })
			.select("id")
			.single<{ id: string }>();
		if (insertErr || !reflection) {
			return json({ error: insertErr?.message ?? "insert failed" }, 500);
		}
		const reflectionId = reflection.id;

		// ── Call OpenAI ──────────────────────────────────────────────────
		let analysis: ReflectionAnalysis;
		if (!openaiKey) {
			// No key configured — return a stub analysis so the UI isn't blocked.
			analysis = {
				themes: ["reflection"],
				alignment: "unclear",
				nudge: "Keep showing up. That's the work.",
			};
		} else {
			const payload: ReflectPayload = {
				focus_areas: focusAreas,
				band: scoreRes.data?.band ?? "Finding",
				provisional: scoreRes.data?.provisional ?? false,
				reflection_body: body,
			};
			try {
				const res = await fetch(OPENAI_URL, {
					method: "POST",
					headers: {
						"content-type": "application/json",
						authorization: `Bearer ${openaiKey}`,
					},
					body: JSON.stringify({
						model: MODEL_NAME,
						messages: [
							{ role: "system", content: SYSTEM_PROMPT },
							{ role: "user", content: buildUserPrompt(payload) },
						],
						response_format: {
							type: "json_schema",
							json_schema: RESPONSE_SCHEMA,
						},
						temperature: 0.4,
						max_tokens: 150,
					}),
				});
				if (!res.ok) {
					const text = await res.text();
					throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`);
				}
				const completion = (await res.json()) as {
					choices?: { message?: { content?: string } }[];
				};
				const content = completion.choices?.[0]?.message?.content;
				if (!content) throw new Error("empty OpenAI response");
				analysis = JSON.parse(content) as ReflectionAnalysis;
			} catch (err) {
				// Fallback: save the reflection body without analysis, surface the error.
				const message = err instanceof Error ? err.message : String(err);
				return json({ reflection_id: reflectionId, error: message }, 200);
			}
		}

		// ── Write analysis back (service role to bypass client update RLS) ─
		const serviceClient = createClient(supabaseUrl, serviceRole, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
		await serviceClient
			.from("user_reflections")
			.update({
				analyzed_at: new Date().toISOString(),
				analysis: {
					...analysis,
					model: MODEL_NAME,
					prompt_version: PROMPT_VERSION,
				},
			})
			.eq("id", reflectionId);

		// ── Analytics (best-effort) ──────────────────────────────────────
		await captureServer("reflection_analyzed", user.id, {
			week_ending: weekEnding,
			alignment: analysis.alignment,
			themes_count: analysis.themes.length,
			model: MODEL_NAME,
			prompt_version: PROMPT_VERSION,
		});

		return json({ reflection_id: reflectionId, analysis });
	});
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}
