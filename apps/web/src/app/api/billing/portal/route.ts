// Polar customer portal (BILLING-01).
// Sends the signed-in user to Polar's hosted portal to manage or cancel their
// subscription. Resolves their Polar customer id from public.subscriptions.

import { env } from "@north/env/server";
import { CustomerPortal } from "@polar-sh/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

// Uses externalCustomerId (the user's Supabase id) rather than Polar's internal
// customer id. The checkout sets customerExternalId = user.id, so Polar already
// has the mapping. This avoids a DB lookup and works even if the subscriptions
// row was not written yet.
const portal = env.POLAR_ACCESS_TOKEN
	? CustomerPortal({
			accessToken: env.POLAR_ACCESS_TOKEN,
			server: env.POLAR_SERVER,
			getExternalCustomerId: async () => {
				const supabase = await getServerSupabase();
				const {
					data: { user },
				} = await supabase.auth.getUser();
				return user?.id ?? "";
			},
		})
	: null;

export async function GET(req: NextRequest) {
	if (!portal) {
		return NextResponse.json(
			{ error: "billing is not configured" },
			{ status: 503 },
		);
	}
	return portal(req);
}
