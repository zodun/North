// Premium checkout (BILLING-01).
// Starts a Polar Checkout for the signed-in user. We call the Polar SDK
// directly rather than using the @polar-sh/nextjs Checkout() adapter, because
// the adapter's catch block returns NextResponse.error() (status 0) which
// causes Node.js to crash with "RangeError: Invalid status code: 0".

import { env } from "@north/env/server";
import { Polar } from "@polar-sh/sdk";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	if (!env.POLAR_ACCESS_TOKEN || !env.POLAR_PRODUCT_ID) {
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

	// Build successUrl with the checkout ID placeholder Polar substitutes.
	let successUrl: string | undefined;
	if (env.POLAR_SUCCESS_URL) {
		const u = new URL(env.POLAR_SUCCESS_URL);
		u.searchParams.set("checkoutId", "{CHECKOUT_ID}");
		successUrl = decodeURI(u.toString());
	}

	try {
		const checkout = await polar.checkouts.create({
			products: [env.POLAR_PRODUCT_ID],
			externalCustomerId: user.id,
			customerEmail: user.email ?? undefined,
			successUrl,
		});

		const redirectUrl = new URL(checkout.url);
		redirectUrl.searchParams.set("theme", "dark");
		return NextResponse.redirect(redirectUrl.toString());
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error("polar checkout error:", message);
		return NextResponse.json(
			{ error: "checkout unavailable", detail: message },
			{ status: 502 },
		);
	}
}
