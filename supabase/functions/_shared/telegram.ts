// Telegram Bot API helper (NOTIF-03).
// Free, no templates, no geo restrictions, just a bot token from @BotFather.

export function telegramToken(): string | null {
	return Deno.env.get("TELEGRAM_BOT_TOKEN") || null;
}

export function botUsername(): string | null {
	return Deno.env.get("TELEGRAM_BOT_USERNAME") || null;
}

const API = "https://api.telegram.org";

// Strip whatever shape the username secret was set in (a leading @, a pasted
// t.me/ or https://t.me/ prefix, stray whitespace) down to a bare handle.
function normalizeUsername(raw: string): string {
	return raw
		.trim()
		.replace(/^https?:\/\/t\.me\//i, "")
		.replace(/^t\.me\//i, "")
		.replace(/^@+/, "")
		.trim();
}

// The @username to build the t.me deep link from. Prefer the authoritative value
// from getMe (derived from the bot token), so the link can never drift from the
// real bot when the TELEGRAM_BOT_USERNAME secret is stale, wrong, or the bot's
// display name by mistake (the cause of the "bot not found" t.me page). Falls
// back to the configured secret only when getMe is unavailable.
export async function resolveBotUsername(): Promise<string | null> {
	const token = telegramToken();
	if (token) {
		try {
			const res = await fetch(`${API}/bot${token}/getMe`);
			if (res.ok) {
				const data = await res.json();
				const u = data?.result?.username;
				if (typeof u === "string" && u.trim()) return u.trim();
			}
		} catch {
			// Network/Telegram hiccup: fall through to the configured secret.
		}
	}
	const raw = botUsername();
	return raw ? normalizeUsername(raw) || null : null;
}

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
