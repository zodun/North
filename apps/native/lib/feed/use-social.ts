// Social layer for the For You deck: likes, comments, creator follows, share.
//
// Bypass mode: everything is served from the in-memory fixture stores so the
// whole loop works without a session (optimistic, survives re-mounts).
//
// Real mode: feed_likes / feed_comments / creator_follows (see the
// 20260731T*_feed_social.sql migration). Every read is best-effort — a
// missing table or RLS denial degrades to empty state, never a crash.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Share } from "react-native";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { mockCommentsFor, mockLikeCount, mockStores } from "./fixtures";
import type { FeedComment, FeedSlide } from "./types";

// ── Share ────────────────────────────────────────────────────────────────

function shareContent(slide: FeedSlide): { title: string; message: string } {
	switch (slide.type) {
		case "video": {
			const url = slide.item.external_url;
			return {
				title: slide.item.title,
				message: url ? `${slide.item.title}\n${url}` : slide.item.title,
			};
		}
		case "signal":
			return {
				title: "Signal of the day",
				message: `"${slide.quote}"${slide.attribution ? ` — ${slide.attribution}` : ""}\n\nvia North`,
			};
		case "opportunity":
			return {
				title: slide.title,
				message: [slide.title, slide.org, slide.deadline, slide.url]
					.filter(Boolean)
					.join("\n"),
			};
		case "story":
			return {
				title: slide.title,
				message: `${slide.title}\n\n${slide.excerpt}\n\nvia North`,
			};
		case "article":
			return {
				title: slide.title,
				message: slide.url ? `${slide.title}\n${slide.url}` : slide.title,
			};
		case "discussion":
			return {
				title: "Join the discussion on North",
				message: `"${slide.quote}" — ${slide.author}\n\nJoin the discussion on North`,
			};
		case "digest":
			return {
				title: "My week on North",
				message: `${slide.weekLabel} on North: ${slide.newOpportunities} new opportunities.`,
			};
	}
}

/** Native share sheet for any slide. Never throws (user cancel included). */
export async function shareSlide(slide: FeedSlide): Promise<void> {
	const { title, message } = shareContent(slide);
	try {
		await Share.share({ title, message }, { dialogTitle: title });
	} catch {
		// user dismissed / share unavailable — nothing to do
	}
}

// ── Likes + comment counts + follows ─────────────────────────────────────

export function useFeedSocial(slides: FeedSlide[]) {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const userId = session?.user.id ?? null;

	const [liked, setLiked] = useState<Set<string>>(new Set());
	const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());
	const [commentCounts, setCommentCounts] = useState<Map<string, number>>(
		new Map(),
	);
	const [following, setFollowing] = useState<Set<string>>(new Set());

	// Digest is a summary, not content — it takes no social actions.
	const ids = useMemo(
		() => slides.filter((s) => s.type !== "digest").map((s) => s.id),
		[slides],
	);
	const idsKey = ids.join(",");

	// idsKey stands in for ids (stable string identity for the array).
	// biome-ignore lint/correctness/useExhaustiveDependencies: idsKey covers ids
	useEffect(() => {
		let cancelled = false;

		if (bypass) {
			const counts = new Map<string, number>();
			const comments = new Map<string, number>();
			for (const id of ids) {
				counts.set(id, mockLikeCount(id));
				comments.set(id, mockCommentsFor(id).length);
			}
			setLikeCounts(counts);
			setCommentCounts(comments);
			setLiked(new Set(mockStores.likedByMe));
			setFollowing(new Set(mockStores.follows));
			return;
		}

		if (!userId || ids.length === 0) return;

		(async () => {
			// Likes: one query returns everyone's rows for these items (RLS allows
			// authenticated reads so counts are real), own state derived from it.
			const { data: likeRows, error: likeErr } = await supabase
				.from("feed_likes")
				.select("user_id, item_id")
				.in("item_id", ids);
			if (!cancelled && !likeErr && likeRows) {
				const counts = new Map<string, number>();
				const mine = new Set<string>();
				for (const r of likeRows as { user_id: string; item_id: string }[]) {
					counts.set(r.item_id, (counts.get(r.item_id) ?? 0) + 1);
					if (r.user_id === userId) mine.add(r.item_id);
				}
				setLikeCounts(counts);
				setLiked(mine);
			}

			const { data: commentRows, error: commentErr } = await supabase
				.from("feed_comments")
				.select("item_id")
				.in("item_id", ids);
			if (!cancelled && !commentErr && commentRows) {
				const counts = new Map<string, number>();
				for (const r of commentRows as { item_id: string }[]) {
					counts.set(r.item_id, (counts.get(r.item_id) ?? 0) + 1);
				}
				setCommentCounts(counts);
			}

			const { data: followRows, error: followErr } = await supabase
				.from("creator_follows")
				.select("creator_id")
				.eq("follower_id", userId);
			if (!cancelled && !followErr && followRows) {
				setFollowing(
					new Set(
						(followRows as { creator_id: string }[]).map((r) => r.creator_id),
					),
				);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [bypass, userId, idsKey]);

	const isLiked = useCallback((id: string) => liked.has(id), [liked]);
	const likeCount = useCallback(
		(id: string) => likeCounts.get(id) ?? 0,
		[likeCounts],
	);
	const commentCount = useCallback(
		(id: string) => commentCounts.get(id) ?? 0,
		[commentCounts],
	);
	const isFollowing = useCallback(
		(creatorId: string) => following.has(creatorId),
		[following],
	);

	const toggleLike = useCallback(
		(id: string) => {
			const wasLiked = liked.has(id);
			// Optimistic flip.
			setLiked((prev) => {
				const next = new Set(prev);
				if (wasLiked) next.delete(id);
				else next.add(id);
				return next;
			});
			setLikeCounts((prev) => {
				const next = new Map(prev);
				next.set(id, Math.max(0, (prev.get(id) ?? 0) + (wasLiked ? -1 : 1)));
				return next;
			});

			if (bypass) {
				if (wasLiked) mockStores.likedByMe.delete(id);
				else mockStores.likedByMe.add(id);
				mockStores.likeCounts.set(
					id,
					Math.max(0, mockLikeCount(id) + (wasLiked ? -1 : 1)),
				);
				return;
			}
			if (!userId) return;
			void (async () => {
				if (wasLiked) {
					await supabase
						.from("feed_likes")
						.delete()
						.eq("user_id", userId)
						.eq("item_id", id);
				} else {
					await supabase
						.from("feed_likes")
						.insert({ user_id: userId, item_id: id });
				}
			})();
		},
		[bypass, userId, liked],
	);

	const toggleFollow = useCallback(
		(creatorId: string) => {
			const was = following.has(creatorId);
			setFollowing((prev) => {
				const next = new Set(prev);
				if (was) next.delete(creatorId);
				else next.add(creatorId);
				return next;
			});

			if (bypass) {
				if (was) mockStores.follows.delete(creatorId);
				else mockStores.follows.add(creatorId);
				return;
			}
			if (!userId) return;
			void (async () => {
				if (was) {
					await supabase
						.from("creator_follows")
						.delete()
						.eq("follower_id", userId)
						.eq("creator_id", creatorId);
				} else {
					await supabase
						.from("creator_follows")
						.insert({ follower_id: userId, creator_id: creatorId });
				}
			})();
		},
		[bypass, userId, following],
	);

	/** Called by the comment sheet after a successful post. */
	const bumpCommentCount = useCallback((id: string) => {
		setCommentCounts((prev) => {
			const next = new Map(prev);
			next.set(id, (prev.get(id) ?? 0) + 1);
			return next;
		});
	}, []);

	return {
		isLiked,
		likeCount,
		commentCount,
		isFollowing,
		toggleLike,
		toggleFollow,
		bumpCommentCount,
	};
}

// ── Per-item comments (drives the sheet) ─────────────────────────────────

export function useComments(itemId: string | null) {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const userId = session?.user.id ?? null;

	const [comments, setComments] = useState<FeedComment[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!itemId) {
			setComments([]);
			return;
		}
		let cancelled = false;

		if (bypass) {
			setComments([...mockCommentsFor(itemId)]);
			return;
		}

		setLoading(true);
		(async () => {
			const { data, error } = await supabase
				.from("feed_comments")
				.select("id, user_id, item_id, body, created_at")
				.eq("item_id", itemId)
				.order("created_at", { ascending: true })
				.limit(200);
			if (cancelled) return;
			if (error || !data) {
				setComments([]);
				setLoading(false);
				return;
			}
			const rows = data as {
				id: string;
				user_id: string;
				item_id: string;
				body: string;
				created_at: string;
			}[];
			let names: Record<string, string> = {};
			const authorIds = [...new Set(rows.map((r) => r.user_id))];
			if (authorIds.length > 0) {
				const { data: profiles } = await supabase
					.from("profiles")
					.select("user_id, display_name")
					.in("user_id", authorIds);
				names = Object.fromEntries(
					(
						(profiles ?? []) as {
							user_id: string;
							display_name: string | null;
						}[]
					).map((p) => [p.user_id, p.display_name?.trim() || "Someone"]),
				);
			}
			if (cancelled) return;
			setComments(
				rows.map((r) => ({
					id: r.id,
					item_id: r.item_id,
					author: names[r.user_id] ?? "Someone",
					body: r.body,
					created_at: r.created_at,
					isMine: r.user_id === userId,
				})),
			);
			setLoading(false);
		})();

		return () => {
			cancelled = true;
		};
	}, [bypass, itemId, userId]);

	const add = useCallback(
		async (body: string): Promise<boolean> => {
			const text = body.trim();
			if (!itemId || !text || submitting) return false;

			const local: FeedComment = {
				id: `local-${Date.now()}`,
				item_id: itemId,
				author: "You",
				body: text,
				created_at: new Date().toISOString(),
				isMine: true,
			};

			if (bypass) {
				mockCommentsFor(itemId).push(local);
				setComments((prev) => [...prev, local]);
				return true;
			}
			if (!userId) return false;

			setSubmitting(true);
			setComments((prev) => [...prev, local]); // optimistic
			const { error } = await supabase.from("feed_comments").insert({
				user_id: userId,
				item_id: itemId,
				body: text,
			});
			setSubmitting(false);
			if (error) {
				setComments((prev) => prev.filter((c) => c.id !== local.id));
				return false;
			}
			return true;
		},
		[bypass, itemId, userId, submitting],
	);

	return { comments, loading, submitting, add };
}
