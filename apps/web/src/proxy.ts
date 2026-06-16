import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	const response = NextResponse.next({ request });

	const supabase = createServerClient(
		// Server-side: talk to Supabase directly (local), not the public browser
		// URL, which may be a tunnel proxy (see next.config.ts /sb rewrite).
		process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.SUPABASE_ANON_KEY ??
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
			"",
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value, options } of cookiesToSet) {
						response.cookies.set({ name, value, ...(options ?? {}) });
					}
				},
			},
		},
	);

	const {
		data: { session },
	} = await supabase.auth.getSession();

	const pathname = request.nextUrl.pathname;

	// Public utility endpoints, each with its own SSRF guard and no access to user
	// data. They MUST bypass the auth/onboarding redirects: an <img> (for /api/img)
	// or fetch (for /api/og-image) cannot follow a 307 into a sign-in HTML page, so
	// gating them silently breaks every card image. /api/img is the same-origin
	// image proxy every For You card loads through, keeping it public is what makes
	// real images actually render.
	if (
		pathname.startsWith("/api/img") ||
		pathname.startsWith("/api/og-image") ||
		pathname.startsWith("/api/cover")
	) {
		return response;
	}

	const isSignIn = pathname === "/sign-in" || pathname === "/sign-up";
	const isAuthRoute = pathname.startsWith("/auth/");
	const isOnboarding = pathname.startsWith("/onboarding");
	const isRoot = pathname === "/";

	// Redirect root to feed
	if (isRoot) {
		const url = request.nextUrl.clone();
		url.pathname = "/for-you";
		return NextResponse.redirect(url);
	}

	// Not signed in, protect all product routes
	if (!session && !isSignIn && !isAuthRoute) {
		const url = request.nextUrl.clone();
		url.pathname = "/sign-in";
		return NextResponse.redirect(url);
	}

	if (session) {
		// Check onboarding completion
		const { data: profile } = await supabase
			.from("profiles")
			.select("onboarded_at")
			.eq("user_id", session.user.id)
			.maybeSingle();

		const isOnboarded = !!profile?.onboarded_at;

		// Already signed in but not yet onboarded, go to onboarding
		if (!isOnboarded && !isOnboarding && !isSignIn && !isAuthRoute) {
			const url = request.nextUrl.clone();
			url.pathname = "/onboarding";
			return NextResponse.redirect(url);
		}

		// Onboarding complete but still on onboarding/sign-in, go to feed
		if (isOnboarded && (isOnboarding || isSignIn)) {
			const url = request.nextUrl.clone();
			url.pathname = "/for-you";
			return NextResponse.redirect(url);
		}
	}

	return response;
}

export const config = {
	matcher: [
		"/((?!sb/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|js|css)$).*)",
	],
};
