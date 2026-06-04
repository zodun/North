"use server";

import { revalidatePath } from "next/cache";

import { getServerSupabase } from "@/lib/supabase-server";

// Promotes an opportunity to cleared and sets published_at = now().
// The DB constraint (0009_content_licensing.sql) rejects the update if
// external_url is missing — the constraint error is returned as-is.
export async function clearOpportunity(id: string) {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: "Unauthorized" };

	const { data: isAdmin } = await supabase.rpc("is_admin");
	if (!isAdmin) return { error: "Forbidden" };

	const { error } = await supabase
		.from("opportunities")
		.update({
			license_status: "cleared",
			published_at: new Date().toISOString(),
		})
		.eq("id", id);

	if (error) return { error: error.message };
	revalidatePath("/admin/opportunities");
	return { ok: true };
}
