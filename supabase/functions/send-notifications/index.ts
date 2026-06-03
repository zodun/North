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
import { getAPNsJWT, sendAPNs } from "./apns.ts";
import { getCopy, type NotificationType } from "./copy.ts";
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

type RunResult = {
	type: NotificationType;
	candidates: number;
	sent: number;
	skipped: number;
	stale_removed: number;
	errors: number;
};

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
	const { title, body } = getCopy(type);
	const result: RunResult = {
		type,
		candidates: 0,
		sent: 0,
		skipped: 0,
		stale_removed: 0,
		errors: 0,
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

	// Load eligible users: have a push token + have a mission today.
	const { data: candidates, error: candErr } = await supabase
		.from("push_tokens")
		.select(
			"user_id, token, platform, missions!inner(id, mission_date, user_mission_tasks(done))",
		)
		.eq("missions.mission_date", today);

	if (candErr) throw new Error(`load candidates: ${candErr.message}`);

	const rows = (candidates ?? []) as (TokenRow & {
		missions: { id: string; user_mission_tasks: { done: boolean }[] }[];
	})[];

	for (const row of rows) {
		result.candidates++;

		// Evening type: skip users who have at least one task done.
		if (type === "evening") {
			const anyDone = row.missions.some((m) =>
				m.user_mission_tasks.some((t) => t.done),
			);
			if (anyDone) {
				result.skipped++;
				continue;
			}
		}

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
