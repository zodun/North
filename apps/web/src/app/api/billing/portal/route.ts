// Polar customer portal (BILLING-01).
// Sends the signed-in user to Polar's hosted portal to manage or cancel their
// subscription. Resolves their Polar customer id from public.subscriptions.

import { env } from "@north/env/server";
import { CustomerPortal } from "@polar-sh/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

const portal = env.POLAR_ACCESS_TOKEN
	? CustomerPortal({
			accessToken: env.POLAR_ACCESS_TOKEN,
			server: env.POLAR_SERVER,
			getCustomerId: async () => {
				const supabase = await getServerSupabase();
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user) return "";
				const { data } = await supabase
					.from("subscriptions")
					.select("polar_customer_id")
					.eq("user_id", user.id)
					.maybeSingle<{ polar_customer_id: string | null }>();
				return data?.polar_customer_id ?? "";
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
