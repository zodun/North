import type { Metadata } from "next";
import { getIsPremium } from "@/lib/entitlement";
import { personalize } from "@/lib/personalize";
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

	const initialSaved = savedRows
		.filter((r) => !r.applied)
		.map((r) => r.opportunity_id);

	const initialApplied = savedRows
		.filter((r) => r.applied)
		.map((r) => r.opportunity_id);

	// AI re-ranks opportunities to the user's direction with a personalized
	// "why this fits you". Premium gets the full ranking (folded into matchScore,
	// which the list already sorts by) + a reason on every pick. Free users get a
	// one-pick preview — their single best match as the hero + reason — and an
	// upgrade card to unlock the rest; everything else stays in focus order.
	const isPremium = user ? await getIsPremium(supabase, user.id) : false;
	let listItems = scored;
	let preview = false;
	if (user && scored.length > 0) {
		const res = await personalize(
			supabase,
			"opportunities",
			scored.map((i) => ({
				id: i.id,
				label: `${i.opportunity_type ?? i.category_id ?? "Opportunity"}: ${i.title} — ${i.org}`,
			})),
		);
		if (res && res.order.length > 0) {
			if (isPremium) {
				const pos = new Map(res.order.map((id, idx) => [id, idx]));
				listItems = scored.map((it) => ({
					...it,
					matchScore: pos.has(it.id)
						? res.order.length - (pos.get(it.id) ?? 0)
						: 0,
					why: res.whyById.get(it.id) ?? it.why,
				}));
			} else {
				const topId = res.order[0];
				const topWhy = res.whyById.get(topId) ?? null;
				if (topWhy) {
					listItems = scored.map((it) =>
						it.id === topId ? { ...it, matchScore: 9999, why: topWhy } : it,
					);
					preview = true;
				}
			}
		}
	}

	return (
		<OpportunitiesList
			items={listItems}
			preview={preview}
			categories={categoriesRes.data ?? []}
			initialSaved={initialSaved}
			initialApplied={initialApplied}
			userFocusAreas={userFocusAreas}
		/>
	);
}
