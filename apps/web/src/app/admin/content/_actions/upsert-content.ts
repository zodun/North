"use server";

// Server action backing the admin Upload Widget callback (DEC-20).
// Writes a content_items row with cloudinary_public_id +
// license_type='cloudinary-hosted' + license_status='draft' so the
// row is staged for admin review before it reaches the client.

import { revalidatePath } from "next/cache";

import { getServerSupabase } from "@/lib/supabase-server";

export type UpsertContentInput = {
	kind: "essay" | "voice" | "story" | "opportunity";
	title: string;
	body?: string;
	focusAreaId?: string;
	contentCategoryId?: string;
	sortOrder?: number;
	cloudinaryPublicId?: string;
	externalUrl?: string;
	attributionText?: string;
};

export async function upsertContent(input: UpsertContentInput) {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: "Unauthorized" };

	const { data: isAdmin } = await supabase.rpc("is_admin");
	if (!isAdmin) return { error: "Forbidden" };

	const licenseType = input.cloudinaryPublicId
		? "cloudinary-hosted"
		: input.externalUrl
			? "link-out"
			: "unknown";

	const { data, error } = await supabase
		.from("content_items")
		.insert({
			kind: input.kind,
			title: input.title,
			body: input.body ?? null,
			focus_area_id: input.focusAreaId ?? null,
			content_category_id: input.contentCategoryId ?? null,
			sort_order: input.sortOrder ?? 0,
			cloudinary_public_id: input.cloudinaryPublicId ?? null,
			external_url: input.externalUrl ?? null,
			attribution_text: input.attributionText ?? null,
			license_type: licenseType,
			// Always draft on creation, admin promotes to 'cleared'
			// once attribution + permission evidence are confirmed.
			license_status: "draft",
		})
		.select("id")
		.single();

	if (error) return { error: error.message };
	revalidatePath("/admin/content");
	return { id: data.id };
}
