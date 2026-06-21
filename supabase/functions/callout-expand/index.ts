// Edge Function: callout-expand
// Receives a signal/noise callout body and returns 2-3 sentences of calm,
// specific coaching: amplify the pattern if positive, address it if it's
// noise or drift.
//
// Auth: user JWT via Authorization header (supabase.functions.invoke sends it
// automatically).
//
// Operator setup (once per environment):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy callout-expand

import { createClient } from "@supabase/supabase-js";

import { corsHeaders, preflight } from "../_shared/cors.ts";
import { stripDashes } from "../_shared/text.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL_NAME = "claude-haiku-4-5";

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { ...corsHeaders, "content-type": "application/json" },
	});
}

const SYSTEM_PROMPT = `You are North's direction coach for young Caribbean professionals aged 18 to 30. Your tone is calm, observational, and grounded. You never use urgency language, streak pressure, or gamification. You are never prescriptive. You never use em dashes or en dashes. Write as though speaking quietly to a thoughtful person who wants to move in the right direction.`;

if (typeof Deno !== "undefined" && Deno.env.get("DENO_TESTING") !== "1") {
	Deno.serve(async (req: Request) => {
		const pf = preflight(req);
		if (pf) return pf;

		const authHeader = req.headers.get("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return json({ error: "missing authorization" }, 401);
		}
		const jwt = authHeader.slice(7);

		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
		if (!supabaseUrl) return json({ error: "missing env" }, 500);

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
		if (authErr || !user) return json({ error: "unauthorized" }, 401);

		let body: string;
		let label: string | undefined;
		let journalBody: string | undefined;
		try {
			const parsed = (await req.json()) as {
				body?: unknown;
				label?: unknown;
				journalBody?: unknown;
			};
			if (typeof parsed.body !== "string" || !parsed.body.trim()) {
				return json({ error: "body is required" }, 400);
			}
			body = parsed.body.trim().slice(0, 500);
			label = typeof parsed.label === "string" ? parsed.label : undefined;
			journalBody =
				typeof parsed.journalBody === "string" && parsed.journalBody.trim()
					? parsed.journalBody.trim().slice(0, 1200)
					: undefined;
		} catch {
			return json({ error: "invalid JSON" }, 400);
		}

		if (!anthropicKey) {
			return json({
				expansion:
					"Small consistent patterns compound over time. Keep noticing what pulls you toward or away from your focus.",
			});
		}

		const isNoise = label?.toLowerCase().includes("noise");
		const journalContext = journalBody
			? `\n\nJournal entry this week:\n"${journalBody}"\n`
			: "";

		const directive = isNoise
			? `This is a noise pattern detected in the user's week. Noise is anything that grabbed their attention without serving their direction. Using the specific details in the observation and the journal entry, write 2 to 3 sentences explaining concretely how they can reduce or avoid this exact distraction going forward. Name what stole attention and suggest one grounded shift.`
			: `This is a signal pattern detected in the user's week. Signal is any action or habit that moved them toward their goal. Using the specific details in the observation and the journal entry, write 2 to 3 sentences explaining concretely how they can build on and amplify this exact momentum. Name what worked and suggest how to do more of it.`;

		const userPrompt = `Weekly observation: "${body}"${journalContext}
${directive}

Plain prose only. No bullet points, no headers. No dashes. Be specific to what the person actually wrote, not general advice.`;

		try {
			const res = await fetch(ANTHROPIC_URL, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-api-key": anthropicKey,
					"anthropic-version": ANTHROPIC_VERSION,
				},
				body: JSON.stringify({
					model: MODEL_NAME,
					max_tokens: 160,
					system: SYSTEM_PROMPT,
					messages: [{ role: "user", content: userPrompt }],
				}),
			});
			if (!res.ok) {
				throw new Error(`Anthropic ${res.status}`);
			}
			const data = (await res.json()) as {
				content?: { type: string; text?: string }[];
			};
			const text = (data.content ?? [])
				.filter((b) => b.type === "text")
				.map((b) => b.text ?? "")
				.join("")
				.trim();

			return json({ expansion: stripDashes(text) || null });
		} catch {
			return json({ expansion: null });
		}
	});
}
