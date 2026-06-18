import type { Metadata } from "next";
import { countryFlag } from "@/lib/flag";
import { getServerSupabase } from "@/lib/supabase-server";
import { type ThreadPost, type ThreadReply, ThreadView } from "../thread-view";

export const metadata: Metadata = { title: "Discussion" };

// Forum thread page: one discussion (peer_posts row) with its full reply thread
// (peer_replies) and a reply box. Authors come from the minimal public_profiles
// view so we never widen profiles RLS.
export default async function ThreadPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center">
				<p className="text-[#0E1420]/55 text-sm">
					Sign in to join the discussion.
				</p>
			</div>
		);
	}

	const { data: postRow } = await supabase
		.from("peer_posts")
		.select(
			"id, user_id, category, title, body, is_anonymous, likes_count, created_at",
		)
		.eq("id", id)
		.maybeSingle();

	if (!postRow) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
				<p className="font-semibold text-[#0E1420] text-lg">
					This discussion isn't here.
				</p>
				<a
					href="/community"
					className="rounded-xl bg-[#005ac2] px-5 py-2.5 font-bold text-sm text-white"
				>
					Back to Community
				</a>
			</div>
		);
	}

	const anon = postRow.is_anonymous as boolean;

	const [{ data: authorRow }, { data: likeRow }, { data: replyRows }] =
		await Promise.all([
			anon
				? Promise.resolve({ data: null })
				: supabase
						.from("public_profiles")
						.select("display_name, country")
						.eq("user_id", postRow.user_id as string)
						.maybeSingle(),
			supabase
				.from("peer_likes")
				.select("post_id")
				.eq("user_id", user.id)
				.eq("post_id", id)
				.maybeSingle(),
			supabase
				.from("peer_replies")
				.select("id, user_id, body, created_at")
				.eq("post_id", id)
				.order("created_at", { ascending: true }),
		]);

	const author = authorRow as {
		display_name: string | null;
		country: string | null;
	} | null;
	const authorName = anon ? "Anonymous" : (author?.display_name ?? "Member");

	const post: ThreadPost = {
		id: postRow.id as string,
		category: postRow.category as string,
		title: (postRow.title as string | null) ?? null,
		body: postRow.body as string,
		authorName,
		authorInitial: (authorName[0] ?? "·").toUpperCase(),
		authorDetail: anon ? null : (author?.country ?? null),
		flag: anon ? "" : countryFlag(author?.country),
		likesCount: postRow.likes_count as number,
		liked: Boolean(likeRow),
	};

	// Resolve reply author names through public_profiles in one batch.
	const replies = (replyRows ?? []) as {
		id: string;
		user_id: string;
		body: string;
	}[];
	const replyAuthorIds = [...new Set(replies.map((r) => r.user_id))];
	const nameById = new Map<string, string>();
	if (replyAuthorIds.length) {
		const { data: replyAuthors } = await supabase
			.from("public_profiles")
			.select("user_id, display_name")
			.in("user_id", replyAuthorIds);
		for (const a of (replyAuthors ?? []) as {
			user_id: string;
			display_name: string | null;
		}[])
			nameById.set(a.user_id, a.display_name ?? "Member");
	}
	const initialReplies: ThreadReply[] = replies.map((r) => {
		const name = nameById.get(r.user_id) ?? "Member";
		return {
			id: r.id,
			body: r.body,
			name,
			initial: (name[0] ?? "·").toUpperCase(),
		};
	});

	const { data: me } = await supabase
		.from("public_profiles")
		.select("display_name")
		.eq("user_id", user.id)
		.maybeSingle();

	return (
		<ThreadView
			userId={user.id}
			currentName={(me?.display_name as string | null) ?? "You"}
			post={post}
			initialReplies={initialReplies}
		/>
	);
}
