import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import {
	type CommunityPost,
	CommunityView,
	type FocusMap,
	type LiveStrip,
	type Partner,
	type PublicProfile,
	type Viewer,
} from "./community-view";

export const metadata: Metadata = { title: "Community" };

const DAY_MS = 86_400_000;

export default async function CommunityPage() {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center">
				<p className="text-[#0E1420]/55 text-sm">
					Sign in to join the community.
				</p>
			</div>
		);
	}

	// Focus-area catalogue (id → label + hue) for avatar colours and pills.
	const { data: focusRows } = await supabase
		.from("focus_areas")
		.select("id, label, hue");
	const focusMap: FocusMap = {};
	for (const f of focusRows ?? []) {
		focusMap[f.id as string] = {
			label: f.label as string,
			hue: f.hue as string,
		};
	}

	// Everyone's safe display data comes from the public_profiles view.
	const { data: meRow } = await supabase
		.from("public_profiles")
		.select("user_id, display_name, country, focus_area_ids, signal_score")
		.eq("user_id", user.id)
		.maybeSingle();

	const viewer: Viewer = {
		userId: user.id,
		displayName: (meRow?.display_name as string) ?? "You",
		signalScore: (meRow?.signal_score as number | null) ?? null,
		focusAreaIds: (meRow?.focus_area_ids as string[] | null) ?? [],
	};

	// First page of posts (newest first).
	const { data: postRows } = await supabase
		.from("peer_posts")
		.select(
			"id, user_id, category, title, body, is_anonymous, likes_count, replies_count, signal_boost, created_at",
		)
		.order("created_at", { ascending: false })
		.limit(10);
	const posts = postRows ?? [];

	const authorIds = [...new Set(posts.map((p) => p.user_id as string))];
	const postIds = posts.map((p) => p.id as string);

	const [{ data: authorRows }, { data: likeRows }] = await Promise.all([
		authorIds.length
			? supabase
					.from("public_profiles")
					.select(
						"user_id, display_name, country, focus_area_ids, signal_band, signal_score",
					)
					.in("user_id", authorIds)
			: Promise.resolve({ data: [] as PublicProfile[] }),
		postIds.length
			? supabase
					.from("peer_likes")
					.select("post_id")
					.eq("user_id", user.id)
					.in("post_id", postIds)
			: Promise.resolve({ data: [] as { post_id: string }[] }),
	]);

	const authorById = new Map<string, PublicProfile>();
	for (const a of (authorRows ?? []) as PublicProfile[]) {
		authorById.set(a.user_id, a);
	}
	const likedSet = new Set(
		((likeRows ?? []) as { post_id: string }[]).map((r) => r.post_id),
	);

	// Featured = the single most-liked post from the last 24h (likes > 0).
	const since = Date.now() - DAY_MS;
	let featuredId: string | null = null;
	let bestLikes = 0;
	for (const p of posts) {
		const ts = Date.parse(p.created_at as string);
		const likes = p.likes_count as number;
		if (ts >= since && likes > bestLikes) {
			bestLikes = likes;
			featuredId = p.id as string;
		}
	}

	const initialPosts: CommunityPost[] = posts.map((p) => ({
		id: p.id as string,
		userId: p.user_id as string,
		category: p.category as CommunityPost["category"],
		title: (p.title as string | null) ?? null,
		body: p.body as string,
		isAnonymous: p.is_anonymous as boolean,
		likesCount: p.likes_count as number,
		repliesCount: p.replies_count as number,
		signalBoost: p.signal_boost as boolean,
		createdAt: p.created_at as string,
		author: authorById.get(p.user_id as string) ?? null,
		liked: likedSet.has(p.id as string),
		featured: featuredId === p.id,
	}));

	// Accountability suggestions: shared focus area + signal within 15 points,
	// excluding self and anyone already paired.
	const { data: pairRows } = await supabase
		.from("accountability_pairs")
		.select("user_id_1, user_id_2")
		.or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
	const pairedIds = new Set<string>();
	for (const pr of pairRows ?? []) {
		pairedIds.add(pr.user_id_1 as string);
		pairedIds.add(pr.user_id_2 as string);
	}

	const { data: candidateRows } = await supabase
		.from("public_profiles")
		.select(
			"user_id, display_name, country, focus_area_ids, signal_band, signal_score",
		)
		.neq("user_id", user.id)
		.limit(40);

	const myFocus = new Set(viewer.focusAreaIds);
	const partners: Partner[] = ((candidateRows ?? []) as PublicProfile[])
		.filter((c) => {
			if (pairedIds.has(c.user_id)) return false;
			const sharesFocus = (c.focus_area_ids ?? []).some((f) => myFocus.has(f));
			if (!sharesFocus) return false;
			if (viewer.signalScore == null || c.signal_score == null) return true;
			return Math.abs(c.signal_score - viewer.signalScore) <= 15;
		})
		.slice(0, 2)
		.map((c) => ({
			userId: c.user_id,
			displayName: c.display_name,
			country: c.country,
			focusAreaIds: c.focus_area_ids,
			signalScore: c.signal_score,
		}));

	// Live members strip — total members, distinct countries, a few avatars.
	const { count: memberCount } = await supabase
		.from("public_profiles")
		.select("user_id", { count: "exact", head: true });
	const { data: sampleRows } = await supabase
		.from("public_profiles")
		.select("display_name, country, focus_area_ids")
		.limit(60);
	const sample = (sampleRows ?? []) as Pick<
		PublicProfile,
		"display_name" | "country" | "focus_area_ids"
	>[];
	const countrySet = new Set(
		sample.map((s) => s.country).filter((c): c is string => Boolean(c)),
	);
	const live: LiveStrip = {
		count: memberCount ?? sample.length,
		countries: countrySet.size,
		avatars: sample.slice(0, 4).map((s, i) => ({
			id: `av-${i}`,
			initial: (s.display_name?.[0] ?? "·").toUpperCase(),
			hue: focusMap[s.focus_area_ids?.[0] ?? ""]?.hue ?? "#F5C842",
		})),
	};

	return (
		<CommunityView
			viewer={viewer}
			focusMap={focusMap}
			initialPosts={initialPosts}
			partners={partners}
			live={live}
		/>
	);
}
