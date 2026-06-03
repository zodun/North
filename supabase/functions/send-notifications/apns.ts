// APNs HTTP/2 sender for iOS push tokens.
//
// Uses the APNs Provider API with JWT authentication (ES256).
// Required secrets:
//   APNS_TEAM_ID   — 10-character Apple Developer team ID
//   APNS_KEY_ID    — 10-character key ID from Apple Developer portal
//   APNS_PRIVATE_KEY — content of the .p8 file (ES256 private key)
//   APNS_BUNDLE_ID — e.g. com.north.app
//
// Tokens are raw APNs device tokens (hex strings) stored by
// getDevicePushTokenAsync() on the native client.

export type APNsResult = "sent" | "invalid_token" | "error";

const APNS_HOST = "https://api.push.apple.com";

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

// Cache the JWT per key — valid for up to 1 hour, APNs allows reuse.
let _cachedJWT: { jwt: string; issuedAt: number } | null = null;

export async function getAPNsJWT(
	teamId: string,
	keyId: string,
	privateKeyPem: string,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	// Reuse if issued within the last 45 minutes (Apple max is 60 min).
	if (_cachedJWT && now - _cachedJWT.issuedAt < 2700) {
		return _cachedJWT.jwt;
	}

	const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId }));
	const payload = b64url(JSON.stringify({ iss: teamId, iat: now }));
	const sigInput = `${header}.${payload}`;

	const key = await crypto.subtle.importKey(
		"pkcs8",
		pemToDer(privateKeyPem),
		{ name: "ECDSA", namedCurve: "P-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign(
		{ name: "ECDSA", hash: "SHA-256" },
		key,
		new TextEncoder().encode(sigInput),
	);
	const jwt = `${sigInput}.${b64url(new Uint8Array(sig))}`;
	_cachedJWT = { jwt, issuedAt: now };
	return jwt;
}

export async function sendAPNs(
	token: string,
	title: string,
	body: string,
	bundleId: string,
	jwt: string,
	fetcher: typeof fetch = fetch,
): Promise<APNsResult> {
	const url = `${APNS_HOST}/3/device/${token}`;
	const resp = await fetcher(url, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `bearer ${jwt}`,
			"apns-push-type": "alert",
			"apns-topic": bundleId,
		},
		body: JSON.stringify({
			aps: {
				alert: { title, body },
				sound: "default",
			},
		}),
	});

	if (resp.ok) return "sent";

	const text = await resp.text();
	if (
		resp.status === 400 &&
		(text.includes("BadDeviceToken") || text.includes("Unregistered"))
	) {
		return "invalid_token";
	}
	return "error";
}
