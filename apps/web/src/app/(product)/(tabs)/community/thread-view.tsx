"use client";

import { useState } from "react";
import { supabase } from "@/lib/auth-client";
import { catMeta, SCOPED_CSS, Sidebar } from "./community-hub";

// A single discussion as its own forum thread: the original post pinned up top,
// the full reply thread below, and a reply box. Likes and replies both write to
// the peer_* backend (peer_likes / peer_replies); the DB triggers keep the
// counters and points in sync. Replies are uncapped, the one-a-day limit only
// applies to starting a discussion.

const PRIMARY = "#005ac2";
const ON_SURFACE = "#131313";
const ON_VARIANT = "#424754";
const SERIF = "'Libre Caslon Text', Georgia, serif";
const SANS = "'Sora', system-ui, sans-serif";
const FONT_SHEET =
	"https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap";
const ICON_SHEET =
	"https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block";

export type ThreadPost = {
	id: string;
	category: string;
	title: string | null;
	body: string;
	authorName: string;
	authorInitial: string;
	authorDetail: string | null;
	flag?: string;
	likesCount: number;
	liked: boolean;
};
export type ThreadReply = {
	id: string;
	body: string;
	name: string;
	initial: string;
};

export function ThreadView({
	userId,
	currentName,
	post,
	initialReplies,
}: {
	userId: string;
	currentName: string;
	post: ThreadPost;
	initialReplies: ThreadReply[];
}) {
	const cat = catMeta(post.category);
	const [liked, setLiked] = useState(post.liked);
	const [likesCount, setLikesCount] = useState(post.likesCount);
	const [replies, setReplies] = useState<ThreadReply[]>(initialReplies);
	const [draft, setDraft] = useState("");
	const [busy, setBusy] = useState(false);

	async function toggleLike() {
		const next = !liked;
		setLiked(next);
		setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));
		try {
			if (next)
				await supabase
					.from("peer_likes")
					.insert({ user_id: userId, post_id: post.id });
			else
				await supabase
					.from("peer_likes")
					.delete()
					.eq("user_id", userId)
					.eq("post_id", post.id);
		} catch {
			setLiked(!next);
			setLikesCount((c) => Math.max(0, c + (next ? -1 : 1)));
		}
	}

	async function submitReply() {
		if (!draft.trim() || busy) return;
		setBusy(true);
		const { data, error } = await supabase
			.from("peer_replies")
			.insert({ post_id: post.id, user_id: userId, body: draft.trim() })
			.select("id, body")
			.single();
		setBusy(false);
		if (error || !data) return;
		setReplies((prev) => [
			...prev,
			{
				id: data.id as string,
				body: data.body as string,
				name: currentName,
				initial: (currentName[0] ?? "·").toUpperCase(),
			},
		]);
		setDraft("");
	}

	return (
		<div style={{ background: "#F8F9FA", color: ON_SURFACE, fontFamily: SANS }}>
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link
				rel="preconnect"
				href="https://fonts.gstatic.com"
				crossOrigin="anonymous"
			/>
			<link rel="stylesheet" href={FONT_SHEET} precedence="default" />
			<link rel="stylesheet" href={ICON_SHEET} precedence="default" />
			<style>{SCOPED_CSS}</style>

			<Sidebar />

			<div className="ch-main relative min-h-screen">
				<header
					className="sticky top-0 z-40 px-5 py-3 backdrop-blur-md sm:px-6 lg:px-8"
					style={{ background: "rgba(248,249,250,0.7)" }}
				>
					<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
						<a
							href="/community"
							className="flex items-center gap-1.5 font-bold text-sm transition-colors"
							style={{ color: ON_VARIANT }}
						>
							<span className="material-symbols-outlined text-xl">
								arrow_back
							</span>
							Community
						</a>
						<a
							href="/profile"
							aria-label="Your profile"
							className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white shadow-sm"
						>
							<span
								className="material-symbols-outlined text-xl"
								style={{ color: ON_VARIANT }}
							>
								person
							</span>
						</a>
					</div>
				</header>

				<div className="relative z-[1] px-5 pb-6 sm:px-6 lg:px-8">
					<div className="mx-auto mt-4 max-w-3xl">
						{/* ── Original post ───────────────────────────────────── */}
						<article className="cm-rise glass-gradient-border rounded-[2rem] p-7 sm:p-9">
							<div className="flex items-start gap-4">
								<span
									className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold"
									style={{ background: `${cat.color}1f`, color: cat.color }}
								>
									{post.authorInitial}
								</span>
								<div className="min-w-0 flex-1">
									<div className="mb-2 flex flex-wrap items-center gap-2">
										<span
											className="rounded-full px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider"
											style={{ background: `${cat.color}1f`, color: cat.color }}
										>
											{cat.label}
										</span>
										<span className="font-bold text-sm">{post.authorName}</span>
										{post.flag && <span aria-hidden="true">{post.flag}</span>}
										{post.authorDetail && (
											<span
												className="text-xs"
												style={{ color: ON_VARIANT, opacity: 0.5 }}
											>
												{post.authorDetail}
											</span>
										)}
									</div>
									{post.title && (
										<h1
											className="mb-2 font-bold text-2xl leading-tight tracking-tight sm:text-3xl"
											style={{ fontFamily: SERIF }}
										>
											{post.title}
										</h1>
									)}
									<p
										className="whitespace-pre-wrap text-base leading-relaxed"
										style={{ color: ON_VARIANT, opacity: 0.9 }}
									>
										{post.body}
									</p>
									<div className="mt-5 border-black/5 border-t pt-4">
										<button
											type="button"
											onClick={() => void toggleLike()}
											aria-pressed={liked}
											className="flex items-center gap-1.5 font-medium text-sm transition-colors"
											style={{ color: liked ? PRIMARY : ON_VARIANT }}
										>
											<span
												className={`material-symbols-outlined text-lg ${liked ? "cm-heart-liked" : ""}`}
												style={{
													fontVariationSettings: liked
														? "'FILL' 1"
														: "'FILL' 0",
												}}
											>
												favorite
											</span>
											{likesCount}
										</button>
									</div>
								</div>
							</div>
						</article>

						{/* ── Replies ─────────────────────────────────────────── */}
						<div className="mt-8 mb-4 flex items-center gap-2">
							<span
								className="material-symbols-outlined"
								style={{ color: PRIMARY }}
							>
								forum
							</span>
							<h2 className="font-bold text-lg" style={{ fontFamily: SERIF }}>
								{replies.length === 0
									? "No replies yet"
									: `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
							</h2>
						</div>

						{replies.length > 0 && (
							<div className="space-y-3">
								{replies.map((r) => (
									<div
										key={r.id}
										className="glass-panel flex items-start gap-3 rounded-2xl p-5"
									>
										<span
											className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm"
											style={{
												background: "rgba(0,90,194,0.1)",
												color: PRIMARY,
											}}
										>
											{r.initial}
										</span>
										<div className="min-w-0 flex-1">
											<p className="mb-0.5 font-bold text-sm">{r.name}</p>
											<p
												className="whitespace-pre-wrap text-sm leading-relaxed"
												style={{ color: ON_VARIANT, opacity: 0.9 }}
											>
												{r.body}
											</p>
										</div>
									</div>
								))}
							</div>
						)}

						{/* ── Reply composer ──────────────────────────────────── */}
						<div className="glass-gradient-border mt-4 rounded-2xl p-3">
							<textarea
								value={draft}
								onChange={(e) => setDraft(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
										e.preventDefault();
										void submitReply();
									}
								}}
								placeholder="Add your reply…"
								maxLength={2000}
								rows={3}
								className="w-full resize-none border-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-black/30"
								style={{ color: ON_SURFACE }}
							/>
							<div className="mt-1 flex items-center justify-between gap-3 px-1">
								<span
									className="text-[11px]"
									style={{ color: ON_VARIANT, opacity: 0.55 }}
								>
									Reply as {currentName}
								</span>
								<button
									type="button"
									onClick={() => void submitReply()}
									disabled={!draft.trim() || busy}
									className="rounded-xl px-6 py-2.5 font-bold text-sm text-white uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
									style={{ background: PRIMARY }}
								>
									{busy ? "…" : "Reply"}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
