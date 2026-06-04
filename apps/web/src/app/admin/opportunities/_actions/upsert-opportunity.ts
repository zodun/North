"use server";

import { revalidatePath } from "next/cache";

import { getServerSupabase } from "@/lib/supabase-server";

export type UpsertOpportunityInput = {
	title: string;
	org: string;
	categoryId: string;
	opportunityType?: string;
	location?: string;
	deadline?: string;
	why?: string;
	externalUrl: string;
	attributionText: string;
};

export async function upsertOpportunity(input: UpsertOpportunityInput) {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: "Unauthorized" };

	const { data: isAdmin } = await supabase.rpc("is_admin");
	if (!isAdmin) return { error: "Forbidden" };

	const { data, error } = await supabase
		.from("opportunities")
		.insert({
			title: input.title,
			org: input.org,
			category_id: input.categoryId,
			opportunity_type: input.opportunityType ?? null,
			location: input.location ?? null,
			deadline: input.deadline ?? null,
			why: input.why ?? null,
			external_url: input.externalUrl,
			attribution_text: input.attributionText,
			license_status: "draft",
		})
		.select("id")
		.single();

	if (error) return { error: error.message };
	revalidatePath("/admin/opportunities");
	return { id: data.id };
}
