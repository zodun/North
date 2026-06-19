import type { Metadata } from "next";
import { getIsPremium } from "@/lib/entitlement";
import { applyOrder, personalize } from "@/lib/personalize";
import { isPurposeMode } from "@/lib/purpose";
import { getServerSupabase } from "@/lib/supabase-server";
import { SleekForYou } from "./sleek-feed";

export const metadata: Metadata = { title: "For You" };

// Server component: fetches the real personalised feed and hands it to the
// "Sleek Light" presentation (./sleek-feed). Same data pipeline the editorial
// feed used, content_items + onboarding focus/format ranking + AI re-rank,
// so the redesign is wired to the backend, not static.
export default async function ForYouPage() {
	const supabase = await getServerSupabase();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { data: items } = await supabase
		.from("content_items")
		.select(
			"id, kind, title, eyebrow, body, source, external_url, cloudinary_public_id, thumbnail_url, content_category_id, published_at",
		)
		.not("license_status", "eq", "blocked")
		.order("sort_order", { ascending: true })
		.order("published_at", { ascending: false })
		.limit(30);

	const { data: existingInteractions } = user
		? await supabase
				.from("content_interactions")
				.select("content_item_id, action")
				.eq("user_id", user.id)
				.in("action", ["save", "matters"])
				.in(
					"content_item_id",
					(items ?? []).map((i) => i.id),
				)
		: { data: [] };

	const initialSaved = new Set(
		(existingInteractions ?? [])
			.filter((r) => r.action === "save")
			.map((r) => r.content_item_id),
	);

	const { data: categories } = await supabase
		.from("content_categories")
		.select("id, label")
		.order("sort_order");

	// Aspiration captured in onboarding, personalises the hero's reason line.
	const { data: profile } = user
		? await supabase
				.from("profiles")
				.select("aspiration, content_formats, fields, purpose_mode")
				.eq("user_id", user.id)
				.maybeSingle()
		: { data: null };

	// Onboarding focus areas → keep the feed specific to chosen topics. Falls back
	// to the full pool when the user has no focus areas or too few on-topic cards.
	const { data: focusRows } = user
		? await supabase
				.from("user_focus_areas")
				.select("focus_area_id")
				.eq("user_id", user.id)
		: { data: [] };
	const FOCUS_EYEBROW: Record<string, string> = {
		money: "Money",
		learn: "Skills",
		craft: "Skills",
		mind: "Mindset",
		people: "Career",
		venture: "Entrepreneurship",
	};
	const focusEyebrows = new Set(
		(focusRows ?? [])
			.map((r) => FOCUS_EYEBROW[r.focus_area_id as string])
			.filter(Boolean),
	);
	const allItems = items ?? [];
	const onTopic = focusEyebrows.size
		? allItems.filter((i) => i.eyebrow && focusEyebrows.has(i.eyebrow))
		: allItems;

	// Rules-based ranking from onboarding (works without the AI personalize layer,
	// which needs the LLM API): honour the chosen format (listen/watch/read) and
	// surface items whose text overlaps the user's aspiration + fields, so the hero
	// reflects onboarding even when the edge function is unavailable.
	const formats = new Set(
		((profile?.content_formats as string[] | null) ?? []) as string[],
	);
	const KIND_FORMAT: Record<string, string> = {
		essay: "read",
		story: "read",
		opportunity: "read",
		video: "watch",
		voice: "listen",
	};
	// Drop generic + "still figuring it out"-style filler so only meaningful
	// aspiration/field words drive the boost.
	const STOP = new Set([
		"still",
		"figuring",
		"out",
		"the",
		"and",
		"for",
		"you",
		"your",
		"with",
		"about",
		"into",
		"want",
		"would",
		"really",
		"more",
		"some",
		"thing",
		"things",
		"stuff",
		"just",
		"able",
	]);
	const intentWords = [
		...new Set(
			`${profile?.aspiration ?? ""} ${(
				(profile?.fields as string[] | null) ?? []
			).join(" ")}`
				.toLowerCase()
				.match(/[a-z]{3,}/g) ?? [],
		),
	].filter((w) => !STOP.has(w));
	const formatOf = (kind: string) => KIND_FORMAT[kind] ?? "read";
	// A "listen"/"watch" person doesn't want a wall of text; when their exact
	// format is missing (e.g. no audio in the pool), video is the closest match.
	const prefersNonRead = formats.has("listen") || formats.has("watch");
	const scoreItem = (it: {
		kind: string;
		title: string;
		body: string | null;
	}) => {
		let s = 0;
		const fmt = formatOf(it.kind);
		if (formats.size && formats.has(fmt)) s += 5;
		else if (prefersNonRead && fmt === "watch") s += 3;
		if (intentWords.length) {
			// Whole-word match so "an app" doesn't spuriously hit "application".
			const words = new Set(
				`${it.title} ${it.body ?? ""}`.toLowerCase().match(/[a-z]{3,}/g) ?? [],
			);
			for (const w of intentWords) if (words.has(w)) s += 2;
		}
		return s;
	};
	const ranked = [...onTopic].sort((a, b) => scoreItem(b) - scoreItem(a));

	// Hard-filter to the user's preferred format so the feed honours what they
	// chose in onboarding. Falls back to the unfiltered on-topic pool only when
	// fewer than 3 matching items exist, so the page is never empty.
	const formatFiltered = formats.size
		? ranked.filter((i) => formats.has(formatOf(i.kind)))
		: ranked;
	const basePool = formatFiltered.length >= 3 ? formatFiltered : ranked;

	// AI re-ranks around the user's direction. Premium sees the full order + a
	// reason on the hero; free users get a one-pick preview (their best match
	// surfaced as the hero) plus an upgrade prompt.
	const isPremium = user ? await getIsPremium(supabase, user.id) : false;
	const onTopicIds = new Set(onTopic.map((i) => i.id));
	const offTopic = allItems.filter((i) => !onTopicIds.has(i.id));
	const offTopicFiltered = formats.size
		? offTopic.filter((i) => formats.has(formatOf(i.kind)))
		: offTopic;
	let feedItems: (NonNullable<typeof items>[number] & {
		why?: string | null;
	})[] =
		onTopic.length > 0
			? [...basePool, ...offTopicFiltered]
			: formats.size
				? allItems.filter((i) => formats.has(formatOf(i.kind)))
				: allItems;
	let preview = false;
	if (user && feedItems.length > 0) {
		const res = await personalize(
			supabase,
			"feed",
			feedItems.map((i) => ({
				id: i.id,
				label: `${i.kind}: ${i.title}${i.eyebrow ? `, ${i.eyebrow}` : ""}`,
			})),
		);
		if (res && res.order.length > 0) {
			if (isPremium) {
				feedItems = applyOrder(feedItems, res.order).map((i) => ({
					...i,
					why: res.whyById.get(i.id) ?? null,
				}));
			} else {
				const topId = res.order[0];
				const topWhy = res.whyById.get(topId) ?? null;
				const top = feedItems.find((i) => i.id === topId);
				if (top && topWhy) {
					feedItems = [
						{ ...top, why: topWhy },
						...feedItems
							.filter((i) => i.id !== topId)
							.map((i) => ({ ...i, why: null })),
					];
					preview = true;
				}
			}
		}
	}

	// ── Bento blocks ────────────────────────────────────────────────────────────
	// The Stitch mockup's "Mentorship Match" and "Masterclass" cards have no
	// backing tables, so they're replaced with two real North surfaces: the
	// current monthly mission (with step progress) and a featured opportunity.
	const today = new Date().toISOString().slice(0, 10);

	const { data: missionRow } = user
		? await supabase
				.from("monthly_missions")
				.select("id, goal_title, goal_intent")
				.eq("user_id", user.id)
				.order("month_start", { ascending: false })
				.limit(1)
				.maybeSingle()
		: { data: null };
	const { data: missionSteps } = missionRow
		? await supabase
				.from("monthly_mission_steps")
				.select("done")
				.eq("monthly_mission_id", missionRow.id)
		: { data: [] };
	const mission = missionRow
		? {
				title: missionRow.goal_title as string,
				intent: (missionRow.goal_intent as string | null) ?? null,
				done: (missionSteps ?? []).filter((s) => s.done).length,
				total: (missionSteps ?? []).length,
			}
		: null;

	// Featured opportunity: soonest upcoming deadline, else most recent.
	const { data: oppRows } = await supabase
		.from("opportunities")
		.select(
			"id, title, org, opportunity_type, location, deadline, external_url",
		)
		.order("scraped_at", { ascending: false, nullsFirst: false })
		.order("created_at", { ascending: false })
		.limit(40);
	const upcoming = (oppRows ?? [])
		.filter((o) => o.deadline && (o.deadline as string) >= today)
		.sort((a, b) => (a.deadline as string).localeCompare(b.deadline as string));
	const oppRow = upcoming[0] ?? (oppRows ?? [])[0] ?? null;
	const opportunity = oppRow
		? {
				id: oppRow.id as string,
				title: oppRow.title as string,
				org: (oppRow.org as string | null) ?? null,
				opportunity_type: (oppRow.opportunity_type as string | null) ?? null,
				location: (oppRow.location as string | null) ?? null,
				deadlineLabel: oppRow.deadline
					? new Date(oppRow.deadline as string).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
						})
					: null,
				external_url: (oppRow.external_url as string | null) ?? null,
			}
		: null;

	return (
		<SleekForYou
			items={feedItems}
			categories={categories ?? []}
			initialSaved={[...initialSaved]}
			preview={preview}
			aspiration={(profile?.aspiration as string | null) ?? null}
			purposeMode={
				isPurposeMode(profile?.purpose_mode) ? profile.purpose_mode : null
			}
			mission={mission}
			opportunity={opportunity}
		/>
	);
}
