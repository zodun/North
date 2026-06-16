// Cloudinary signed-upload endpoint (DEC-20).
//
// Receives a `paramsToSign` object from the Upload Widget, signs it
// with the server-only API secret, returns the signature + timestamp +
// API key + cloud name. The Widget then uploads the asset directly to
// Cloudinary using that signature, the secret never leaves the
// server, the client never holds it.
//
// Gated by Supabase admin allow-list (admins table). Non-admin or
// unauthenticated callers get 403; missing Cloudinary credentials get
// 503 so dev without Cloudinary still boots cleanly.

import { env } from "@north/env/server";
import { v2 as cloudinary } from "cloudinary";
import { type NextRequest, NextResponse } from "next/server";

import { getServerSupabase } from "@/lib/supabase-server";

type Body = { paramsToSign: Record<string, string | number> };

export async function POST(request: NextRequest) {
	if (
		!env.CLOUDINARY_CLOUD_NAME ||
		!env.CLOUDINARY_API_KEY ||
		!env.CLOUDINARY_API_SECRET
	) {
		return NextResponse.json(
			{ error: "Cloudinary not configured" },
			{ status: 503 },
		);
	}

	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { data: isAdmin, error: isAdminErr } = await supabase.rpc("is_admin");
	if (isAdminErr || !isAdmin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	let body: Body;
	try {
		body = (await request.json()) as Body;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const signature = cloudinary.utils.api_sign_request(
		body.paramsToSign,
		env.CLOUDINARY_API_SECRET,
	);

	return NextResponse.json({
		signature,
		apiKey: env.CLOUDINARY_API_KEY,
		cloudName: env.CLOUDINARY_CLOUD_NAME,
	});
}
