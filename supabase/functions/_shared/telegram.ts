// Telegram Bot API helper (NOTIF-03).
// Free, no templates, no geo restrictions, just a bot token from @BotFather.

export function telegramToken(): string | null {
	return Deno.env.get("TELEGRAM_BOT_TOKEN") || null;
}

export function botUsername(): string | null {
	return Deno.env.get("TELEGRAM_BOT_USERNAME") || null;
}

const API = "https://api.telegram.org";

// Escape user-supplied text before embedding it in an HTML-parse-mode message.
// Task labels are user content and may contain &, <, > which would otherwise
// break Telegram's HTML parser (or be interpreted as tags).
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

export async function sendMessage(
	token: string,
	chatId: string,
	text: string,
): Promise<{ ok: boolean; error?: string }> {
	try {
		const res = await fetch(`${API}/bot${token}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				text,
				parse_mode: "HTML",
				disable_web_page_preview: true,
			}),
		});
		if (!res.ok) {
			const t = await res.text();
			return { ok: false, error: `Telegram ${res.status}: ${t.slice(0, 300)}` };
		}
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
