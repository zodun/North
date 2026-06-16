// Edge Function: telegram-webhook (NOTIF-03)
// Receives Telegram bot updates. On "/start <token>", looks up the one-time
// token (issued by telegram-link), links that chat to the North user, and turns
// the channel on. Public endpoint, Telegram sends no JWT, secured by the
// X-Telegram-Bot-Api-Secret-Token header set at setWebhook time.
//
// Operator setup (once), point Telegram at this function:
//   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
//     -d "url=https://<project>.supabase.co/functions/v1/telegram-webhook" \
//     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"

import { createClient } from "@supabase/supabase-js";
import { sendMessage, telegramToken } from "../_shared/telegram.ts";

type Update = {
	message?: { chat?: { id?: number }; text?: string };
};

if (typeof Deno !== "undefined" && Deno.env.get("DENO_TESTING") !== "1") {
	Deno.serve(async (req: Request) => {
		// Always 200 to Telegram, even on bad input, so it doesn't retry forever.
		const ok = () => new Response("ok", { status: 200 });

		const secret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
		if (
			secret &&
			req.headers.get("x-telegram-bot-api-secret-token") !== secret
		) {
			return new Response("forbidden", { status: 403 });
		}

		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		const botToken = telegramToken();
		if (!supabaseUrl || !serviceRole || !botToken) return ok();

		let update: Update;
		try {
			update = (await req.json()) as Update;
		} catch {
			return ok();
		}

		const chatId = update.message?.chat?.id;
		const text = update.message?.text ?? "";
		if (chatId == null) return ok();

		const chat = String(chatId);
		const service = createClient(supabaseUrl, serviceRole, {
			auth: { persistSession: false, autoRefreshToken: false },
		});

		const match = text.match(/^\/start\s+(\S+)/);
		if (!match) {
			await sendMessage(
				botToken,
				chat,
				"👋 To get your North reminders here, open North → Profile → Connect Telegram and tap the link.",
			);
			return ok();
		}

		const token = match[1];
		const { data: row } = await service
			.from("telegram_link_tokens")
			.select("user_id, expires_at")
			.eq("token", token)
			.maybeSingle<{ user_id: string; expires_at: string }>();

		if (!row || Date.parse(row.expires_at) < Date.now()) {
			if (row)
				await service.from("telegram_link_tokens").delete().eq("token", token);
			await sendMessage(
				botToken,
				chat,
				"That link expired. Open North → Profile → Connect Telegram for a fresh one.",
			);
			return ok();
		}

		await service
			.from("profiles")
			.update({ telegram_chat_id: chat, telegram_opt_in: true })
			.eq("user_id", row.user_id);
		await service.from("telegram_link_tokens").delete().eq("token", token);

		await sendMessage(
			botToken,
			chat,
			"✅ Connected. You'll get your daily North reminder here. Turn it off any time in Profile.",
		);
		return ok();
	});
}
