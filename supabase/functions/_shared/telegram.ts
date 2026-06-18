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
	// Telegram handles are 5..32 chars of [A-Za-z0-9_]; anything else (e.g. a
	// display name with spaces) would build an invalid t.me URL, so reject it.
	const valid = (u: string) => /^[A-Za-z0-9_]{4,32}$/.test(u);

	const token = telegramToken();
	if (token) {
		try {
			const res = await fetch(`${API}/bot${token}/getMe`);
			if (res.ok) {
				const data = await res.json();
				const u =
					typeof data?.result?.username === "string"
						? data.result.username.trim()
						: "";
				if (valid(u)) {
					console.log(`[telegram] username via getMe: ${u}`);
					return u;
				}
				console.log(
					`[telegram] getMe ok but no valid username: ${JSON.stringify(data?.result?.username ?? null)}`,
				);
			} else {
				console.log(`[telegram] getMe HTTP ${res.status}`);
			}
		} catch (e) {
			console.log(
				`[telegram] getMe threw: ${e instanceof Error ? e.message : String(e)}`,
			);
		}
	} else {
		console.log("[telegram] TELEGRAM_BOT_TOKEN is not set");
	}

	const raw = botUsername();
	const u = raw ? normalizeUsername(raw) : "";
	if (valid(u)) {
		console.log(`[telegram] username via TELEGRAM_BOT_USERNAME secret: ${u}`);
		return u;
	}
	console.log(
		`[telegram] no valid username; secret raw=${JSON.stringify(raw)}`,
	);
	return null;
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
