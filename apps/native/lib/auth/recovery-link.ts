// Parsing for Supabase password-recovery deep links.
//
// The native client is created with `detectSessionInUrl: false` (see the
// native factory in packages/supabase), which is correct — there is no browser
// URL bar to watch — but it means nothing establishes the session for us when
// a recovery link opens the app. This module does that parsing.
//
// Supabase sends the recovery tokens in the URL *fragment*, not the query
// string, because on the web a fragment never reaches the server:
//
//   north://reset-password#access_token=…&refresh_token=…&type=recovery
//
// Failures arrive the same way rather than as a thrown error, most commonly an
// expired link:
//
//   north://reset-password#error=access_denied&error_code=otp_expired…

export type RecoveryLink =
	| { kind: "tokens"; accessToken: string; refreshToken: string }
	| { kind: "error"; message: string }
	| { kind: "none" };

function parsePairs(input: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const pair of input.split("&")) {
		if (!pair) continue;
		const index = pair.indexOf("=");
		if (index === -1) continue;
		const key = decodeURIComponent(pair.slice(0, index));
		const value = decodeURIComponent(pair.slice(index + 1).replace(/\+/g, " "));
		out[key] = value;
	}
	return out;
}

export function parseRecoveryLink(url: string | null): RecoveryLink {
	if (!url) return { kind: "none" };

	// Read both halves. The fragment is where Supabase puts tokens, but errors
	// can appear in the query string depending on the path taken.
	const hashIndex = url.indexOf("#");
	const queryIndex = url.indexOf("?");
	const fragment = hashIndex === -1 ? "" : url.slice(hashIndex + 1);
	const query =
		queryIndex === -1
			? ""
			: url.slice(queryIndex + 1, hashIndex === -1 ? undefined : hashIndex);

	const params = { ...parsePairs(query), ...parsePairs(fragment) };

	if (params.error || params.error_description || params.error_code) {
		const expired =
			params.error_code === "otp_expired" ||
			/expired/i.test(params.error_description ?? "");
		return {
			kind: "error",
			message: expired
				? "That link has expired. Request a new one."
				: (params.error_description ?? "That link didn't work. Try again."),
		};
	}

	if (params.access_token && params.refresh_token) {
		return {
			kind: "tokens",
			accessToken: params.access_token,
			refreshToken: params.refresh_token,
		};
	}

	return { kind: "none" };
}
