import { useCallback, useEffect, useState } from "react";
import { supabase, useSession } from "../auth-client";
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
