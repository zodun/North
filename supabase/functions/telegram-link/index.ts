// Edge Function: telegram-link (NOTIF-03)
// Issues a one-time deep link the user taps to connect Telegram:
//   https://t.me/<bot>?start=<token>
// Pressing Start sends "/start <token>" to the bot; the telegram-webhook
// function reads the token and links that chat to this user.
//
// Auth: user JWT. Tokens live in telegram_link_tokens (service-role only).
//
// Operator setup (once):
//   supabase secrets set TELEGRAM_BOT_TOKEN=123:abc TELEGRAM_BOT_USERNAME=NorthRemindersBot

import { createClient } from "@supabase/supabase-js";
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { resolveBotUsername } from "../_shared/telegram.ts";

const TOKEN_TTL_MS = 15 * 60 * 1000;

function randomToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
		const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		if (!supabaseUrl || !serviceRole)
			return json({ error: "missing env" }, 500);

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

		// Authoritative @username straight from the bot token (getMe), so the deep
		// link always points at the real bot even if TELEGRAM_BOT_USERNAME is stale.
		const username = await resolveBotUsername();
		if (!username) {
			return json(
				{ error: "Telegram bot not configured (set TELEGRAM_BOT_TOKEN)." },
				503,
			);
		}

		const token = randomToken();
		const service = createClient(supabaseUrl, serviceRole, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
		const { error } = await service.from("telegram_link_tokens").upsert(
			{
				token,
				user_id: user.id,
				expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
				created_at: new Date().toISOString(),
			},
			{ onConflict: "token" },
		);
		if (error) return json({ error: error.message }, 500);

		return json({
			ok: true,
			url: `https://t.me/${username}?start=${token}`,
		});
	});
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...corsHeaders },
	});
}
