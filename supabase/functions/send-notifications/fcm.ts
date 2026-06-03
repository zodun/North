// FCM v1 HTTP API sender.
//
// Uses a Google service account to obtain an OAuth2 bearer token, then
// sends individual messages via the FCM v1 messages:send endpoint.
// Token is obtained once per job run and reused for all messages.
//
// Required secret: FIREBASE_SERVICE_ACCOUNT_JSON — the full JSON content
// of a Firebase service account key file (downloadable from the Firebase
// console → Project settings → Service accounts).

export type ServiceAccount = {
	project_id: string;
	client_email: string;
	private_key: string;
};

export type FCMResult = "sent" | "invalid_token" | "error";

const FCM_BASE = "https://fcm.googleapis.com/v1/projects";
const OAUTH_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

// ─── JWT helpers ────────────────────────────────────────────────────────────

function b64url(data: Uint8Array | string): string {
	const str = typeof data === "string" ? data : String.fromCharCode(...data);
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function pemToDer(pem: string): ArrayBuffer {
	const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes.buffer;
}

async function signedJWT(
	payload: Record<string, unknown>,
	privateKeyPem: string,
): Promise<string> {
	const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
	const body = b64url(JSON.stringify(payload));
	const sigInput = `${header}.${body}`;

	const key = await crypto.subtle.importKey(
		"pkcs8",
		pemToDer(privateKeyPem),
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign(
		"RSASSA-PKCS1-v1_5",
		key,
		new TextEncoder().encode(sigInput),
	);
	return `${sigInput}.${b64url(new Uint8Array(sig))}`;
}

// ─── Token exchange ──────────────────────────────────────────────────────────

export async function getAccessToken(
	sa: ServiceAccount,
	fetcher: typeof fetch = fetch,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const jwt = await signedJWT(
		{
			iss: sa.client_email,
			sub: sa.client_email,
			aud: OAUTH_URL,
			iat: now,
			exp: now + 3600,
			scope: SCOPE,
		},
		sa.private_key,
	);
	const resp = await fetcher(OAUTH_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
	});
	if (!resp.ok) throw new Error(`OAuth token exchange failed: ${resp.status}`);
	const json = (await resp.json()) as { access_token?: string };
	if (!json.access_token)
		throw new Error("OAuth response missing access_token");
	return json.access_token;
}

// ─── Send one message ────────────────────────────────────────────────────────

export async function sendFCM(
	token: string,
	title: string,
	body: string,
	projectId: string,
	accessToken: string,
	fetcher: typeof fetch = fetch,
): Promise<FCMResult> {
	const url = `${FCM_BASE}/${projectId}/messages:send`;
	const resp = await fetcher(url, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify({
			message: {
				token,
				notification: { title, body },
				android: {
					notification: { sound: "default", channel_id: "default" },
				},
			},
		}),
	});

	if (resp.ok) return "sent";

	const text = await resp.text();
	// 400/404 with UNREGISTERED or INVALID_ARGUMENT → stale token
	if (
		resp.status === 400 ||
		resp.status === 404 ||
		text.includes("UNREGISTERED") ||
		text.includes("INVALID_ARGUMENT")
	) {
		return "invalid_token";
	}
	return "error";
}
