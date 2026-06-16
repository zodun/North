"use server";

import { revalidatePath } from "next/cache";

import { getServerSupabase } from "@/lib/supabase-server";

// Promotes a content_item to cleared and sets published_at = now().
// The DB constraint (0009_content_licensing.sql) rejects the update if
// attribution_text or a media reference (external_url / cloudinary_public_id)
// is missing, the constraint error is returned to the caller as-is.
export async function clearContent(id: string) {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: "Unauthorized" };

	const { data: isAdmin } = await supabase.rpc("is_admin");
	if (!isAdmin) return { error: "Forbidden" };

	const { error } = await supabase
		.from("content_items")
		.update({
			license_status: "cleared",
			published_at: new Date().toISOString(),
		})
		.eq("id", id);

	if (error) return { error: error.message };
	revalidatePath("/admin/content");
	return { ok: true };
}
