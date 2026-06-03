"use server";

import { revalidatePath } from "next/cache";

import { getServerSupabase } from "@/lib/supabase-server";

export type AddLinkOutInput = {
	kind: "essay" | "voice" | "story" | "opportunity";
	title: string;
	contentCategoryId: string;
	externalUrl: string;
	attributionText: string;
	focusAreaId?: string;
	body?: string;
	sortOrder?: number;
};

export async function addLinkOut(input: AddLinkOutInput) {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: "Unauthorized" };

	const { data: isAdmin } = await supabase.rpc("is_admin");
	if (!isAdmin) return { error: "Forbidden" };

	const { data, error } = await supabase
		.from("content_items")
		.insert({
			kind: input.kind,
			title: input.title,
			content_category_id: input.contentCategoryId,
			external_url: input.externalUrl,
			attribution_text: input.attributionText,
			focus_area_id: input.focusAreaId ?? null,
			body: input.body ?? null,
			sort_order: input.sortOrder ?? 0,
			license_type: "link-out",
			license_status: "draft",
		})
		.select("id")
		.single();

	if (error) return { error: error.message };
	revalidatePath("/admin/content");
	return { id: data.id };
}
