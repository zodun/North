import { createSsrClient } from "@north/supabase/server";
import { cookies } from "next/headers";

export async function getServerSupabase() {
	const cookieStore = await cookies();
	return createSsrClient({
		getAll() {
			return cookieStore
				.getAll()
				.map((c) => ({ name: c.name, value: c.value }));
		},
		setAll(cookiesToSet) {
			for (const { name, value, options } of cookiesToSet) {
				try {
					cookieStore.set({ name, value, ...(options ?? {}) });
				} catch {
					// Setting cookies in a Server Component throws; it's safe to ignore
					// when middleware refreshes the session.
				}
			}
		},
	});
}
