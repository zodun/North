import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { OpportunitiesList } from "./list";

export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage() {
	const supabase = await getServerSupabase();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { data: categories } = await supabase
		.from("opportunity_categories")
		.select("id, label")
		.order("sort_order");

	const { data: items } = await supabase
		.from("opportunities")
		.select(
			"id, title, org, location, deadline, external_url, description, why, category_id",
		)
		.order("created_at", { ascending: false })
		.limit(50);

	const { data: savedRows } = user
		? await supabase
				.from("user_saved_opportunities")
				.select("opportunity_id")
				.eq("user_id", user.id)
		: { data: [] };

	const initialSaved = (savedRows ?? []).map((r) => r.opportunity_id);

	return (
		<OpportunitiesList
			items={items ?? []}
			categories={categories ?? []}
			initialSaved={initialSaved}
		/>
	);
}
