// Edge Function: delete-account
// Lets a signed-in user permanently delete their own account and all data.
// Required for App Store review (Guideline 5.1.1(v): any app that supports
// account creation must offer in-app account deletion) and is the
// consent-withdrawal mechanism named in docs/privacy-dpa-compliance.md.
//
// Auth: user JWT via Authorization header. The function verifies identity
// from the JWT, then uses the service role to delete the auth.users row.
// Every public.* table with user data has an `ON DELETE CASCADE` foreign key
// to auth.users.id (verified against the schema — see the FK audit run
// alongside this change), so deleting the auth user cascades to all of it in
// one operation. `opportunity_submissions.submitted_by` is `ON DELETE SET
// NULL` by design — community submissions outlive the submitter.
//
// This does NOT cancel an active Polar subscription — that lives outside
// Supabase. The client should point the user at the billing portal to cancel
// first; deletion proceeds regardless so the account-deletion right isn't
// gated behind a billing flow.

import { createClient } from "@supabase/supabase-js";

import { corsHeaders, preflight } from "../_shared/cors.ts";
import { captureServer } from "../_shared/posthog.ts";

if (typeof Deno !== "undefined" && Deno.env.get("DENO_TESTING") !== "1") {
	Deno.serve(async (req: Request) => {
		const pf = preflight(req);
		if (pf) return pf;
		if (req.method !== "POST") {
			return json({ error: "method not allowed" }, 405);
		}

		const authHeader = req.headers.get("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return json({ error: "missing authorization" }, 401);
		}
		const jwt = authHeader.slice(7);

		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		if (!supabaseUrl || !serviceRole) {
			return json({ error: "missing env" }, 500);
		}

		// Verify identity from the caller's own JWT — a user may only ever
		// delete themselves; there is no "delete by id" parameter.
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
		if (authErr || !user) {
			return json({ error: "unauthorized" }, 401);
		}

		// Best-effort analytics before the row (and its identity) is gone.
		await captureServer("account_deleted", user.id, {
			platform_app:
				req.headers.get("x-north-platform") === "native" ? "native" : "web",
		});

		const serviceClient = createClient(supabaseUrl, serviceRole, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
		const { error: deleteErr } = await serviceClient.auth.admin.deleteUser(
			user.id,
		);
		if (deleteErr) {
			return json({ error: deleteErr.message }, 500);
		}

		return json({ ok: true });
	});
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...corsHeaders },
	});
}
