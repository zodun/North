import type { Metadata } from "next";
import { getIsPremium } from "@/lib/entitlement";
import { personalize } from "@/lib/personalize";
import { getServerSupabase } from "@/lib/supabase-server";
import { OpportunitiesList } from "./list";

export const metadata: Metadata = { title: "Opportunities" };

// ── Region boost ──────────────────────────────────────────────────────────────
// Items tagged with a region (jamaica/caribbean) score higher for users from
// that region, surfacing locally-sourced opportunities first without hiding
// global options (which stay available below).
const CARIBBEAN_COUNTRIES = new Set([
	"jamaica",
	"trinidad",
	"tobago",
	"barbados",
	"guyana",
	"belize",
	"bahamas",
	"haiti",
	"dominican",
	"cuba",
	"cayman",
	"bermuda",
	"antigua",
	"lucia",
	"grenada",
	"vincent",
	"kitts",
	"dominica",
	"martinique",
	"guadeloupe",
	"aruba",
	"curacao",
	"suriname",
	"puerto rico",
]);

function isCaribbean(country: string): boolean {
	const c = country.toLowerCase();
	return [...CARIBBEAN_COUNTRIES].some((n) => c.includes(n));
}

function regionScore(
	itemRegion: string | null,
	userCountry: string | null,
): number {
	if (!itemRegion || !userCountry) return 0;
	const c = userCountry.toLowerCase();
	if (itemRegion === "jamaica" && c.includes("jamaica")) return 4;
	if (itemRegion === "caribbean" && isCaribbean(c)) return 3;
	if (itemRegion === "jamaica" && isCaribbean(c)) return 2; // Jamaica item, other Caribbean user
	return 0;
}

// ── Onboarding-driven eligibility (location + education) ─────────────────────
// Opportunities carry only free-text location and no structured education field,
// so this is a soft signal that re-ranks rather than a hard filter (fuzzy data
// must never empty the list). Eligible picks float up; clearly out-of-reach ones
// sink.
function locationScore(
	location: string | null,
	country: string | null,
	relocate: boolean,
): number {
	const loc = (location ?? "").toLowerCase();
	if (!loc) return 0;
	if (/(remote|online|worldwide|global|anywhere|virtual)/.test(loc)) return 2;
	const c = (country ?? "").toLowerCase();
	if (c && loc.includes(c)) return 2;
	if (/eligible/.test(loc)) return 2; // e.g. "Remote (Jamaica eligible)"
	return relocate ? 0 : -3; // specific on-site place the user can't reach
}

const USER_EDU_BAND: Record<string, number> = {
	"In high school": 0,
	"High school graduate": 1,
	"In university": 2,
	"Undergraduate degree": 2,
	"Postgraduate degree": 3,
};
function oppEduBand(text: string): number | null {
	const t = text.toLowerCase();
	if (
		/(ph\.?d|doctoral|doctorate|postdoc|post-doc|postgraduate|master'?s|\bmba\b|graduate (program|fellowship|scholarship|students))/.test(
			t,
		)
	)
		return 3;
	if (
		/(undergraduate|bachelor|college student|university student|current students|in college)/.test(
			t,
		)
	)
		return 2;
	if (/(high school|secondary school|teen|under 18)/.test(t)) return 0;
	return null;
}
function educationScore(text: string, edu: string | null): number {
	if (!edu) return 0;
	const userBand = USER_EDU_BAND[edu];
	if (userBand == null) return 0; // self-taught / unknown → no penalty
	const oppBand = oppEduBand(text);
	if (oppBand == null) return 0; // no stated requirement
	return oppBand <= userBand ? 1 : -2; // qualified vs needs a higher level
}

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
					"id, title, org, opportunity_type, location, deadline, external_url, why, category_id, source, focus_area_tags, region",
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
						.select(
							"preferred_opportunity_categories, interests, country, open_to_relocate, education_level",
						)
						.eq("user_id", user.id)
						.maybeSingle()
				: Promise.resolve({ data: null }),
		]);

	const items = itemsRes.data ?? [];
	const savedRows = savedRes.data ?? [];
	const userFocusAreas = (focusRes.data ?? []).map((r) => r.focus_area_id);
	const explicitCategories: string[] =
		profileRes.data?.preferred_opportunity_categories ?? [];
	// Map focus areas to opportunity categories when the user hasn't pinned
	// specific categories, so the category boost is always active and differs per
	// user based on their onboarding answers.
	const FOCUS_TO_OPP_CATS: Record<string, string[]> = {
		craft: ["job", "creator-programme", "event", "accelerator"],
		venture: ["accelerator", "grant", "event"],
		mind: ["community", "event"],
		people: ["community", "event", "job"],
		money: ["scholarship", "grant"],
		learn: ["scholarship", "internship", "event"],
	};
	const preferredCategories: string[] = explicitCategories.length
		? explicitCategories
		: [
				...new Set(
					userFocusAreas.flatMap((f) => FOCUS_TO_OPP_CATS[f as string] ?? []),
				),
			];
	const interests: string[] =
		(profileRes.data?.interests as string[] | null) ?? [];
	const country = (profileRes.data?.country as string | null) ?? null;
	const openToRelocate = Boolean(profileRes.data?.open_to_relocate);
	const educationLevel =
		(profileRes.data?.education_level as string | null) ?? null;

	// Compute a match score per item: focus-area overlap, a boost when the item
	// matches a stated interest (so creative and non-academic picks surface, not
	// just scholarships) or a category the user asked for, plus eligibility from
	// their onboarding location + education answers so reachable, qualifying picks
	// lead.
	const scored = items.map((item) => {
		const tags: string[] = item.focus_area_tags ?? [];
		const focusScore = userFocusAreas.length
			? tags.filter((t) => userFocusAreas.includes(t)).length
			: 0;
		const categoryScore =
			item.category_id && preferredCategories.includes(item.category_id)
				? 2
				: 0;
		const haystack =
			`${item.title} ${item.org} ${item.why ?? ""} ${item.opportunity_type ?? ""} ${item.category_id ?? ""}`.toLowerCase();
		const interestScore = interests.some(
			(i) => i && haystack.includes(i.toLowerCase()),
		)
			? 3
			: 0;
		const locScore = locationScore(item.location, country, openToRelocate);
		const eduScore = educationScore(
			`${item.title} ${item.why ?? ""} ${item.opportunity_type ?? ""}`,
			educationLevel,
		);
		const regScore = regionScore(
			(item.region as string | null) ?? null,
			country,
		);
		return {
			...item,
			matchScore:
				focusScore +
				categoryScore +
				interestScore +
				locScore +
				eduScore +
				regScore,
		};
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
	// one-pick preview, their single best match as the hero + reason, and an
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
				label: `${i.opportunity_type ?? i.category_id ?? "Opportunity"}: ${i.title}, ${i.org}${i.location ? ` (${i.location})` : ""}`,
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
