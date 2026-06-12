// Premium checkout (BILLING-01).
// Starts a Polar Checkout for the signed-in user. We inject the identity
// server-side — `customerExternalId = user.id` — so the webhook can map the
// resulting subscription back to the right account (never trust a client-set id).

import { env } from "@north/env/server";
import { Checkout } from "@polar-sh/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

const checkout = env.POLAR_ACCESS_TOKEN
	? Checkout({
			accessToken: env.POLAR_ACCESS_TOKEN,
			successUrl: env.POLAR_SUCCESS_URL,
			server: env.POLAR_SERVER,
			theme: "dark",
		})
	: null;

export async function GET(req: NextRequest) {
	if (!checkout || !env.POLAR_PRODUCT_ID) {
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

	// Bind the checkout to the authenticated user + the premium product.
	const url = new URL(req.url);
	url.searchParams.set("products", env.POLAR_PRODUCT_ID);
	url.searchParams.set("customerExternalId", user.id);
	if (user.email) url.searchParams.set("customerEmail", user.email);

	return checkout(new NextRequest(url, { headers: req.headers }));
}
