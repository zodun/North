import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	const response = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
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
	const isAdmin = pathname.startsWith("/admin");
	const isLogin = pathname === "/login";
	const isRoot = pathname === "/";

	// Admin: redirect unauthenticated to /login
	if (isAdmin && !session) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	// Admin login: redirect authenticated to /admin
	if (isLogin && session) {
		const url = request.nextUrl.clone();
		url.pathname = "/admin";
		return NextResponse.redirect(url);
	}

	// Root: redirect to product feed
	if (isRoot) {
		const url = request.nextUrl.clone();
		url.pathname = "/for-you";
		return NextResponse.redirect(url);
	}

	return response;
}

export const config = {
	// /north stays public so the design prototype is freely viewable.
	matcher: ["/", "/login", "/admin/:path*"],
};
