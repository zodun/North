import { useCallback, useEffect, useState } from "react";
import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { MOCK_DISCUSSION, MOCK_FIRST_NAME, mockMission } from "../dev-mock";
import type { CommunityPost, PostType } from "./types";

const SELECT =
	"id, user_id, post_type, caption, video_url, thumbnail_url, opportunity_id, created_at";

export function useCommunityPosts() {
	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		setError(null);
		const { data, error: err } = await supabase
			.from("community_posts")
			.select(SELECT)
			.order("created_at", { ascending: false })
			.limit(50);

		if (err) {
			setError(err.message);
		} else {
			setPosts((data ?? []) as CommunityPost[]);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return { posts, loading, error, refresh };
}

export type CreatePostInput = {
	post_type: PostType;
	caption: string;
	opportunity_id?: string | null;
	video_url?: string | null;
	thumbnail_url?: string | null;
};

export function useCreatePost() {
	const { data: session } = useSession();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const create = useCallback(
		async (input: CreatePostInput): Promise<string | null> => {
			if (!session?.user.id) {
				setError("Not signed in");
				return null;
			}
			setSubmitting(true);
			setError(null);

			const { data, error: err } = await supabase
				.from("community_posts")
				.insert({
					user_id: session.user.id,
					post_type: input.post_type,
					caption: input.caption.trim() || null,
					opportunity_id: input.opportunity_id ?? null,
					video_url: input.video_url ?? null,
					thumbnail_url: input.thumbnail_url ?? null,
				})
				.select("id")
				.single();

			setSubmitting(false);
			if (err) {
				setError(err.message);
				return null;
			}
			return (data as { id: string }).id;
		},
		[session],
	);

	return { create, submitting, error };
}

// ── Discussion feed (Community tab) ───────────────────────────────────
//
// community_posts enriched with author names (a second profiles query —
// the table has no FK join) so the tab can show who is working toward
// what. `authorGoal` is only available in mock mode for now; the real
// schema has no public goal yet.

export type DiscussionPost = {
	id: string;
	author: string;
	authorGoal: string | null;
	caption: string;
	createdAt: string;
	isMine: boolean;
};

export function useDiscussion() {
	const { data: session } = useSession();
	const bypass = useAuthBypass();
	const [posts, setPosts] = useState<DiscussionPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const refresh = useCallback(async () => {
		if (bypass) {
			const now = Date.now();
			setPosts((prev) => {
				const locals = prev.filter((p) => p.id.startsWith("local-"));
				const seeded = MOCK_DISCUSSION.map((m) => ({
					id: m.id,
					author: m.author,
					authorGoal: m.authorGoal,
					caption: m.caption,
					createdAt: new Date(now - m.hoursAgo * 3_600_000).toISOString(),
					isMine: m.author === MOCK_FIRST_NAME,
				}));
				return [...locals, ...seeded];
			});
			setLoading(false);
			return;
		}

		const { data } = await supabase
			.from("community_posts")
			.select("id, user_id, caption, created_at")
			.not("caption", "is", null)
			.order("created_at", { ascending: false })
			.limit(50);

		const rows = (data ?? []) as {
			id: string;
			user_id: string;
			caption: string | null;
			created_at: string;
		}[];

		const userIds = [...new Set(rows.map((r) => r.user_id))];
		let names: Record<string, string> = {};
		if (userIds.length > 0) {
			const { data: profiles } = await supabase
				.from("profiles")
				.select("user_id, display_name")
				.in("user_id", userIds);
			names = Object.fromEntries(
				(
					(profiles ?? []) as { user_id: string; display_name: string | null }[]
				).map((p) => [p.user_id, p.display_name?.trim() || "Someone"]),
			);
		}

		setPosts(
			rows
				.filter((r) => r.caption)
				.map((r) => ({
					id: r.id,
					author: names[r.user_id] ?? "Someone",
					authorGoal: null,
					caption: r.caption as string,
					createdAt: r.created_at,
					isMine: r.user_id === session?.user.id,
				})),
		);
		setLoading(false);
	}, [bypass, session?.user.id]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const submit = useCallback(
		async (caption: string): Promise<boolean> => {
			const body = caption.trim();
			if (!body || submitting) return false;
			setSubmitting(true);
			try {
				if (bypass) {
					setPosts((prev) => [
						{
							id: `local-${Date.now()}`,
							author: MOCK_FIRST_NAME,
							authorGoal: mockMission().title,
							caption: body,
							createdAt: new Date().toISOString(),
							isMine: true,
						},
						...prev,
					]);
					return true;
				}
				if (!session?.user.id) return false;
				const { error } = await supabase.from("community_posts").insert({
					user_id: session.user.id,
					post_type: "mission_progress",
					caption: body,
				});
				if (error) return false;
				await refresh();
				return true;
			} finally {
				setSubmitting(false);
			}
		},
		[bypass, session?.user.id, submitting, refresh],
	);

	return { posts, loading, submitting, refresh, submit };
}
