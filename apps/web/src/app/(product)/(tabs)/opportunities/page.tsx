import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { OpportunitiesList } from "./list";

export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage() {
	const supabase = await getServerSupabase();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const [categoriesRes, itemsRes, savedRes, focusRes, profileRes] =
		await Promise.all([
			supabase
				.from("opportunity_categories")
				.select("id, label")
				.order("sort_order"),

			supabase
				.from("opportunities")
				.select(
					"id, title, org, opportunity_type, location, deadline, external_url, why, category_id, source, focus_area_tags",
				)
				.order("scraped_at", { ascending: false, nullsFirst: false })
				.order("created_at", { ascending: false })
				.limit(80),

			user
				? supabase
						.from("user_saved_opportunities")
						.select("opportunity_id, applied")
						.eq("user_id", user.id)
				: Promise.resolve({ data: [] }),

			user
				? supabase
						.from("user_focus_areas")
						.select("focus_area_id")
						.eq("user_id", user.id)
				: Promise.resolve({ data: [] }),

			user
				? supabase
						.from("profiles")
						.select("preferred_opportunity_categories")
						.eq("user_id", user.id)
						.maybeSingle()
				: Promise.resolve({ data: null }),
		]);

	const items = itemsRes.data ?? [];
	const savedRows = savedRes.data ?? [];
	const userFocusAreas = (focusRes.data ?? []).map((r) => r.focus_area_id);
	const preferredCategories: string[] =
		profileRes.data?.preferred_opportunity_categories ?? [];

	// Compute a match score per item: focus-area overlap, plus a boost when the
	// item's category is one the user asked for in onboarding. The category
	// weight (2) outranks a single focus-area match so preferred *types* lead.
	const scored = items.map((item) => {
		const tags: string[] = item.focus_area_tags ?? [];
		const focusScore = userFocusAreas.length
			? tags.filter((t) => userFocusAreas.includes(t)).length
			: 0;
		const categoryScore =
			item.category_id && preferredCategories.includes(item.category_id)
				? 2
				: 0;
		return { ...item, matchScore: focusScore + categoryScore };
	});

	// "Best for you" = items with at least one matching focus area, up to 10
	const topPicks = scored
		.filter((i) => i.matchScore > 0)
		.sort((a, b) => b.matchScore - a.matchScore)
		.slice(0, 10);

	const initialSaved = savedRows
		.filter((r) => !r.applied)
		.map((r) => r.opportunity_id);

	const initialApplied = savedRows
		.filter((r) => r.applied)
		.map((r) => r.opportunity_id);

	return (
		<OpportunitiesList
			items={scored}
			topPicks={topPicks}
			categories={categoriesRes.data ?? []}
			initialSaved={initialSaved}
			initialApplied={initialApplied}
			userFocusAreas={userFocusAreas}
		/>
	);
}
