// Edge Function: send-notifications
// NOTIF-01: daily mission reminder + gentle evening nudge via FCM / APNs.
//
// Two notification types (triggered by separate cron jobs):
//   morning (13:00 UTC = 09:00 AST): sent to everyone with a mission today
//   evening (00:00 UTC = 20:00 AST): sent only to users with 0 tasks done
//
// Android → FCM v1 API (FIREBASE_SERVICE_ACCOUNT_JSON required)
// iOS     → APNs HTTP/2 (APNS_TEAM_ID, APNS_KEY_ID, APNS_PRIVATE_KEY,
//                         APNS_BUNDLE_ID required)
// Skips a platform gracefully when its credentials are absent.
//
// Stale tokens (UNREGISTERED / BadDeviceToken) are deleted from push_tokens.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { escapeHtml, sendMessage, telegramToken } from "../_shared/telegram.ts";
import { getAPNsJWT, sendAPNs } from "./apns.ts";
import { buildBody, getCopy, type NotificationType } from "./copy.ts";
import { getAccessToken, type ServiceAccount, sendFCM } from "./fcm.ts";

const todayInAST = () => {
	const ms = Date.now() - 4 * 60 * 60 * 1000;
	return new Date(ms).toISOString().slice(0, 10);
};

type TokenRow = {
	user_id: string;
	token: string;
	platform: "ios" | "android";
};

type Task = { label: string; done: boolean; detail?: string };

type RunResult = {
	type: NotificationType;
	candidates: number;
	sent: number;
	skipped: number;
	stale_removed: number;
	errors: number;
	telegram_sent: number;
	telegram_errors: number;
};

// Telegram reminder channel (NOTIF-03). Fires only on the morning run, one ping
// a day is enough; the evening nudge stays push-only. Each opted-in, connected
// chat gets a digest of that user's own tasks for today. Skips entirely when the
// bot isn't configured. Honors the user's choice: only telegram_opt_in chats.
async function sendTelegramReminders(
	supabase: SupabaseClient,
	title: string,
	tasksByUser: Map<string, Task[]>,
	result: RunResult,
): Promise<void> {
	const token = telegramToken();
	if (!token) return;

	const userIds = [...tasksByUser.keys()];
	if (userIds.length === 0) return;

	// Opted-in, connected chats among users who have a mission today.
	const { data: rows } = await supabase
		.from("profiles")
		.select("user_id, telegram_chat_id")
		.eq("telegram_opt_in", true)
		.not("telegram_chat_id", "is", null)
		.in("user_id", userIds);

	for (const r of (rows ?? []) as {
		user_id: string;
		telegram_chat_id: string;
	}[]) {
		if (!r.telegram_chat_id) continue;
		const tasks = tasksByUser.get(r.user_id) ?? [];
		// Weekly focus carries a description (the week's depth), show milestone
		// then description. Daily is the bullet list of today's steps.
		const weeklyDetail = tasks.length === 1 ? tasks[0].detail : undefined;
		const body = weeklyDetail
			? `${tasks[0].label}\n\n${weeklyDetail}`
			: buildBody(
					"morning",
					tasks.map((t) => t.label),
				);
		const text = `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`;
		const res = await sendMessage(token, r.telegram_chat_id, text);
		if (res.ok) result.telegram_sent++;
		else result.telegram_errors++;
	}
}

// ── Main job ─────────────────────────────────────────────────────────────────

export async function runNotificationJob(
	supabase: SupabaseClient,
	type: NotificationType,
	creds: {
		fcmServiceAccount?: ServiceAccount;
		apnsTeamId?: string;
		apnsKeyId?: string;
		apnsPrivateKey?: string;
		apnsBundleId?: string;
	},
	fetcher: typeof fetch = fetch,
): Promise<RunResult> {
	const today = todayInAST();
	const { title } = getCopy(type);
	const result: RunResult = {
		type,
		candidates: 0,
		sent: 0,
		skipped: 0,
		stale_removed: 0,
		errors: 0,
		telegram_sent: 0,
		telegram_errors: 0,
	};

	// Obtain FCM access token once (reused for all Android messages).
	let fcmAccessToken: string | null = null;
	if (creds.fcmServiceAccount) {
		try {
			fcmAccessToken = await getAccessToken(creds.fcmServiceAccount, fetcher);
		} catch (err) {
			console.error("FCM token exchange failed:", err);
		}
	}

	// Obtain APNs JWT once (cached for 45 min in apns.ts).
	let apnsJWT: string | null = null;
	if (
		creds.apnsTeamId &&
		creds.apnsKeyId &&
		creds.apnsPrivateKey &&
		creds.apnsBundleId
	) {
		try {
			apnsJWT = await getAPNsJWT(
				creds.apnsTeamId,
				creds.apnsKeyId,
				creds.apnsPrivateKey,
			);
		} catch (err) {
			console.error("APNs JWT failed:", err);
		}
	}

	// Per-user "what to focus on now", the basis for every channel's digest and
	// the evening "any done?" check. Daily-cadence users get today's daily steps
	// (monthly_mission_steps.due_date = today); weekly-cadence users get this
	// week's milestone instead, so weekly people get a meaningful focus rather
	// than a daily micro-step. Step-centric, so a Telegram-only user (no push
	// token) is still covered.
	const cadenceByUser = new Map<string, "daily" | "weekly">();
	{
		const { data: profRows } = await supabase
			.from("profiles")
			.select("user_id, mission_cadence");
		for (const p of (profRows ?? []) as {
			user_id: string;
			mission_cadence: string | null;
		}[]) {
			cadenceByUser.set(
				p.user_id,
				p.mission_cadence === "weekly" ? "weekly" : "daily",
			);
		}
	}

	const tasksByUser = new Map<string, Task[]>();

	// Daily steps due today (for daily-cadence users).
	const { data: dailyRows, error: stepErr } = await supabase
		.from("monthly_mission_steps")
		.select("user_id, title, done")
		.eq("cadence", "daily")
		.eq("due_date", today);
	if (stepErr) throw new Error(`load daily steps: ${stepErr.message}`);
	for (const s of (dailyRows ?? []) as {
		user_id: string;
		title: string;
		done: boolean;
	}[]) {
		if (cadenceByUser.get(s.user_id) === "weekly") continue;
		const arr = tasksByUser.get(s.user_id) ?? [];
		arr.push({ label: s.title, done: s.done });
		tasksByUser.set(s.user_id, arr);
	}

	// Weekly-cadence users: this week's milestone from their current mission. The
	// current phase (0..3) is derived the same way the Mission view does it.
	const monthStart = `${today.slice(0, 7)}-01`;
	const { data: missionRows } = await supabase
		.from("monthly_missions")
		.select("id, user_id, month_start")
		.eq("month_start", monthStart);
	const weeklyMissions = (
		(missionRows ?? []) as {
			id: string;
			user_id: string;
			month_start: string;
		}[]
	).filter((m) => cadenceByUser.get(m.user_id) === "weekly");
	if (weeklyMissions.length > 0) {
		const { data: weeklyRows } = await supabase
			.from("monthly_mission_steps")
			.select("monthly_mission_id, week_index, title, detail, done")
			.eq("cadence", "weekly")
			.in(
				"monthly_mission_id",
				weeklyMissions.map((m) => m.id),
			);
		const weekly = (weeklyRows ?? []) as {
			monthly_mission_id: string;
			week_index: number;
			title: string;
			detail: string | null;
			done: boolean;
		}[];
		for (const m of weeklyMissions) {
			const elapsed =
				(Date.parse(today) - Date.parse(m.month_start)) / 86_400_000;
			const wk = Math.min(3, Math.max(0, Math.floor(elapsed / 7)));
			const step =
				weekly.find(
					(s) => s.monthly_mission_id === m.id && s.week_index === wk,
				) ?? weekly.find((s) => s.monthly_mission_id === m.id);
			if (step) {
				tasksByUser.set(m.user_id, [
					{
						label: step.title,
						done: step.done,
						detail: step.detail ?? undefined,
					},
				]);
			}
		}
	}

	// Push tokens for those users only. No token → no push for that user, but
	// Telegram may still reach them below (their channel choice).
	const userIds = [...tasksByUser.keys()];
	const { data: tokenRows, error: tokErr } =
		userIds.length === 0
			? { data: [] as TokenRow[], error: null }
			: await supabase
					.from("push_tokens")
					.select("user_id, token, platform")
					.in("user_id", userIds);

	if (tokErr) throw new Error(`load push tokens: ${tokErr.message}`);

	const rows = (tokenRows ?? []) as TokenRow[];

	for (const row of rows) {
		result.candidates++;
		const tasks = tasksByUser.get(row.user_id) ?? [];

		// Evening type: skip users who have at least one task done.
		if (type === "evening" && tasks.some((t) => t.done)) {
			result.skipped++;
			continue;
		}

		// Per-user digest: this user's own tasks for today.
		const body = buildBody(
			type,
			tasks.map((t) => t.label),
		);

		let sendResult: "sent" | "invalid_token" | "error" | "no_creds";

		if (row.platform === "android") {
			if (!fcmAccessToken || !creds.fcmServiceAccount) {
				sendResult = "no_creds";
			} else {
				sendResult = await sendFCM(
					row.token,
					title,
					body,
					creds.fcmServiceAccount.project_id,
					fcmAccessToken,
					fetcher,
				);
			}
		} else {
			// iOS / APNs
			if (!apnsJWT || !creds.apnsBundleId) {
				sendResult = "no_creds";
			} else {
				sendResult = await sendAPNs(
					row.token,
					title,
					body,
					creds.apnsBundleId,
					apnsJWT,
					fetcher,
				);
			}
		}

		if (sendResult === "sent") {
			result.sent++;
		} else if (sendResult === "invalid_token") {
			// Remove stale token so future jobs skip this user.
			await supabase.from("push_tokens").delete().eq("user_id", row.user_id);
			result.stale_removed++;
		} else if (sendResult === "no_creds") {
			result.skipped++;
		} else {
			result.errors++;
		}
	}

	// One Telegram reminder a day, on the morning run.
	if (type === "morning") {
		await sendTelegramReminders(supabase, title, tasksByUser, result);
	}

	return result;
}

// ── Deno entrypoint ───────────────────────────────────────────────────────────

if (typeof Deno !== "undefined" && Deno.env.get("DENO_TESTING") !== "1") {
	Deno.serve(async (req: Request) => {
		const expectedSecret = Deno.env.get("NOTIF_TRIGGER_SECRET");
		const presented = req.headers.get("x-trigger-secret");
		if (!expectedSecret || presented !== expectedSecret) {
			return new Response("forbidden", { status: 403 });
		}

		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		if (!supabaseUrl || !serviceRole) {
			return new Response("missing env", { status: 500 });
		}

		let type: NotificationType = "morning";
		try {
			const body = (await req.json()) as { type?: string };
			if (body.type === "evening") type = "evening";
		} catch {
			// No body → default to morning.
		}

		const supabase = createClient(supabaseUrl, serviceRole, {
			auth: { persistSession: false, autoRefreshToken: false },
		});

		// Parse FCM service account from env.
		let fcmServiceAccount: ServiceAccount | undefined;
		const saJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
		if (saJson) {
			try {
				fcmServiceAccount = JSON.parse(saJson) as ServiceAccount;
			} catch {
				console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON");
			}
		}

		try {
			const result = await runNotificationJob(supabase, type, {
				fcmServiceAccount,
				apnsTeamId: Deno.env.get("APNS_TEAM_ID"),
				apnsKeyId: Deno.env.get("APNS_KEY_ID"),
				apnsPrivateKey: Deno.env.get("APNS_PRIVATE_KEY"),
				apnsBundleId: Deno.env.get("APNS_BUNDLE_ID"),
			});
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			return new Response(JSON.stringify({ error: message }), {
				status: 500,
				headers: { "content-type": "application/json" },
			});
		}
	});
}
