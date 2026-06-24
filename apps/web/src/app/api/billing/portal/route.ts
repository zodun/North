// Polar customer portal (BILLING-01).
// Sends the signed-in user to Polar's hosted portal to manage or cancel their
// subscription. Uses externalCustomerId (the user's Supabase id) rather than
// Polar's internal customer id, so no DB lookup is required. We call the Polar
// SDK directly instead of the CustomerPortal() adapter because the adapter's
// catch block returns NextResponse.error() (status 0) which crashes Node.js.

import { env } from "@north/env/server";
import { Polar } from "@polar-sh/sdk";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	if (!env.POLAR_ACCESS_TOKEN) {
		return NextResponse.json(
			{ error: "billing is not configured" },
			{ status: 503 },
		);
	}

	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.redirect(new URL("/sign-in", req.url));
	}

	const polar = new Polar({
		accessToken: env.POLAR_ACCESS_TOKEN,
		server: env.POLAR_SERVER,
	});

	try {
		const session = await polar.customerSessions.create({
			externalCustomerId: user.id,
		});
		return NextResponse.redirect(session.customerPortalUrl);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error("polar portal error:", message);
		return NextResponse.json(
			{ error: "portal unavailable", detail: message },
			{ status: 502 },
		);
	}
}
