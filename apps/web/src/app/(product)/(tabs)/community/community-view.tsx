"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import CommunitySupportBlock from "@/components/ui/community-support-block";
import { supabase } from "@/lib/auth-client";

// ─────────────────────────────────────────────────────────────────────────────
// Community — peer support feed. Reads/writes the peer_* tables; cross-user
// display data comes from the public_profiles view. Gamification points are
// awarded by DB triggers (community_points), never touching the signal score.
// ─────────────────────────────────────────────────────────────────────────────

export type FocusMap = Record<string, { label: string; hue: string }>;

export type PublicProfile = {
	user_id: string;
	display_name: string | null;
	country: string | null;
	focus_area_ids: string[] | null;
	signal_band?: string | null;
	signal_score: number | null;
};

export type Viewer = {
	userId: string;
	displayName: string;
	signalScore: number | null;
	focusAreaIds: string[];
};

export type Partner = {
	userId: string;
	displayName: string | null;
	country: string | null;
	focusAreaIds: string[] | null;
	signalScore: number | null;
};

export type Category =
	| "win"
	| "question"
	| "accountability"
	| "opportunity"
	| "general";

export type CommunityPost = {
	id: string;
	userId: string;
	category: Category;
	title: string | null;
	body: string;
	isAnonymous: boolean;
	likesCount: number;
	repliesCount: number;
	signalBoost: boolean;
	createdAt: string;
	author: PublicProfile | null;
	liked: boolean;
	featured: boolean;
};

export type LiveStrip = {
	count: number;
	countries: number;
	avatars: { id: string; initial: string; hue: string }[];
};

// ── Tokens ───────────────────────────────────────────────────────────────────
const BG = "#EDF1F8";
const TEXT = "#0E1420";
const GOLD = "#F5C842";
const GOLD_INK = "#8A6A00";
const TEAL = "#3ECFBF";
const TEAL_INK = "#0A8F7F";
const VIOLET = "#7B61FF";
const VIOLET_INK = "#5B43E0";
const PAGE = 10;

const FILTERS: { key: "all" | Category; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "win", label: "Wins" },
	{ key: "question", label: "Questions" },
	{ key: "accountability", label: "Accountability" },
	{ key: "opportunity", label: "Opportunities" },
];

const POST_CATEGORIES: { key: Category; label: string }[] = [
	{ key: "win", label: "Win" },
	{ key: "question", label: "Question" },
	{ key: "accountability", label: "Accountability" },
	{ key: "opportunity", label: "Opportunity" },
	{ key: "general", label: "General" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function initialOf(name: string | null | undefined): string {
	return (name?.[0] ?? "·").toUpperCase();
}
function scoreColor(score: number | null): string {
	if (score == null) return "rgba(14,20,32,0.4)";
	if (score < 40) return "rgba(124,77,255,0.8)";
	if (score < 60) return "rgba(62,207,191,0.8)";
	if (score < 80) return GOLD;
	return "#22c55e";
}
function timeAgo(iso: string): string {
	const diff = Date.now() - Date.parse(iso);
	const m = Math.floor(diff / 60000);
	if (m < 1) return "now";
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	const d = Math.floor(h / 24);
	return `${d}d`;
}

const POST_COLS =
	"id, user_id, category, title, body, is_anonymous, likes_count, replies_count, signal_boost, created_at";
const PROFILE_COLS =
	"user_id, display_name, country, focus_area_ids, signal_band, signal_score";

type PostRow = {
	id: string;
	user_id: string;
	category: Category;
	title: string | null;
	body: string;
	is_anonymous: boolean;
	likes_count: number;
	replies_count: number;
	signal_boost: boolean;
	created_at: string;
};

// Fetch a page of posts + their authors + the viewer's likes, merged.
async function fetchPage(
	filter: "all" | Category,
	viewerId: string,
	before: string | null,
): Promise<CommunityPost[]> {
	let q = supabase
		.from("peer_posts")
		.select(POST_COLS)
		.order("created_at", { ascending: false })
		.limit(PAGE);
	if (filter !== "all") q = q.eq("category", filter);
	if (before) q = q.lt("created_at", before);

	const { data, error } = await q;
	if (error) throw error;
	const rows = (data ?? []) as PostRow[];
	if (rows.length === 0) return [];

	const authorIds = [...new Set(rows.map((r) => r.user_id))];
	const postIds = rows.map((r) => r.id);
	const [authorsRes, likesRes] = await Promise.all([
		supabase
			.from("public_profiles")
			.select(PROFILE_COLS)
			.in("user_id", authorIds),
		supabase
			.from("peer_likes")
			.select("post_id")
			.eq("user_id", viewerId)
			.in("post_id", postIds),
	]);
	const authorBy = new Map<string, PublicProfile>();
	for (const a of (authorsRes.data ?? []) as PublicProfile[]) {
		authorBy.set(a.user_id, a);
	}
	const liked = new Set(
		((likesRes.data ?? []) as { post_id: string }[]).map((r) => r.post_id),
	);

	return rows.map((r) => ({
		id: r.id,
		userId: r.user_id,
		category: r.category,
		title: r.title,
		body: r.body,
		isAnonymous: r.is_anonymous,
		likesCount: r.likes_count,
		repliesCount: r.replies_count,
		signalBoost: r.signal_boost,
		createdAt: r.created_at,
		author: authorBy.get(r.user_id) ?? null,
		liked: liked.has(r.id),
		featured: false,
	}));
}

// ─────────────────────────────────────────────────────────────────────────────
export function CommunityView({
	viewer,
	focusMap,
	initialPosts,
	partners: initialPartners,
	live,
}: {
	viewer: Viewer;
	focusMap: FocusMap;
	initialPosts: CommunityPost[];
	partners: Partner[];
	live: LiveStrip;
}) {
	const [filter, setFilter] = useState<"all" | Category>("all");
	const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
	const [partners] = useState<Partner[]>(initialPartners);
	const [connected, setConnected] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE);
	const [error, setError] = useState(false);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);

	// Refetch when the category filter changes (initial "all" is server-rendered).
	const firstRender = useRef(true);
	// biome-ignore lint/correctness/useExhaustiveDependencies: filter/reloadKey are the intended triggers; the firstRender guard skips the server-rendered first page
	useEffect(() => {
		if (firstRender.current) {
			firstRender.current = false;
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError(false);
		fetchPage(filter, viewer.userId, null)
			.then((page) => {
				if (cancelled) return;
				setPosts(page);
				setHasMore(page.length >= PAGE);
			})
			.catch(() => !cancelled && setError(true))
			.finally(() => !cancelled && setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [filter, viewer.userId, reloadKey]);

	const loadMore = useCallback(async () => {
		if (loadingMore || loading || !hasMore || posts.length === 0) return;
		setLoadingMore(true);
		try {
			const before = posts[posts.length - 1]?.createdAt ?? null;
			const page = await fetchPage(filter, viewer.userId, before);
			setPosts((prev) => [...prev, ...page]);
			setHasMore(page.length >= PAGE);
		} catch {
			setError(true);
		} finally {
			setLoadingMore(false);
		}
	}, [filter, viewer.userId, posts, hasMore, loading, loadingMore]);

	// Infinite scroll sentinel.
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) void loadMore();
			},
			{ rootMargin: "200px" },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [loadMore]);

	async function toggleLike(id: string) {
		const post = posts.find((p) => p.id === id);
		if (!post) return;
		const nextLiked = !post.liked;
		setPosts((prev) =>
			prev.map((p) =>
				p.id === id
					? {
							...p,
							liked: nextLiked,
							likesCount: Math.max(0, p.likesCount + (nextLiked ? 1 : -1)),
						}
					: p,
			),
		);
		try {
			if (nextLiked) {
				await supabase
					.from("peer_likes")
					.insert({ user_id: viewer.userId, post_id: id });
			} else {
				await supabase
					.from("peer_likes")
					.delete()
					.eq("user_id", viewer.userId)
					.eq("post_id", id);
			}
		} catch {
			// Revert on failure.
			setPosts((prev) =>
				prev.map((p) =>
					p.id === id
						? {
								...p,
								liked: post.liked,
								likesCount: post.likesCount,
							}
						: p,
				),
			);
		}
	}

	async function connectPartner(partner: Partner) {
		setConnected((prev) => new Set(prev).add(partner.userId));
		try {
			await supabase.from("accountability_pairs").insert({
				user_id_1: viewer.userId,
				user_id_2: partner.userId,
				status: "pending",
			});
		} catch {
			setConnected((prev) => {
				const next = new Set(prev);
				next.delete(partner.userId);
				return next;
			});
		}
	}

	function handlePosted(post: CommunityPost) {
		setSheetOpen(false);
		if (filter === "all" || filter === post.category) {
			setPosts((prev) => [post, ...prev]);
		}
	}

	return (
		<div
			className="min-h-full font-jakarta"
			style={{ background: BG, color: TEXT }}
		>
			<style>{ANIM}</style>

			{/* ── Header ── */}
			<header
				className="sticky top-0 z-20 px-[18px] pt-4 pb-3"
				style={{
					background: BG,
					borderBottom: "1px solid rgba(180,140,60,0.1)",
				}}
			>
				<div className="mb-3 flex items-center justify-between">
					<h1 className="font-black text-[22px] tracking-tight">Community</h1>
					<div className="flex items-center gap-2">
						<button
							type="button"
							aria-label="Search community"
							className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border bg-white"
							style={{ borderColor: "rgba(14,20,32,0.08)" }}
						>
							<SearchIcon />
						</button>
						<button
							type="button"
							onClick={() => setSheetOpen(true)}
							className="flex cursor-pointer items-center gap-1.5 rounded-full border-none px-4 py-2 font-bold text-[#05050E] text-[12px]"
							style={{
								background: GOLD,
							}}
						>
							<PlusIcon />
							Post
						</button>
						<a
							href="/profile"
							aria-label="Your profile"
							className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full font-black text-[13px]"
							style={{
								background: "rgba(245,200,66,0.14)",
								color: GOLD_INK,
							}}
						>
							{initialOf(viewer.displayName)}
						</a>
					</div>
				</div>

				{/* Category filters */}
				<div
					className="-mx-[18px] flex gap-[6px] overflow-x-auto px-[18px] [&::-webkit-scrollbar]:hidden"
					style={{ scrollbarWidth: "none" }}
				>
					{FILTERS.map((f) => {
						const active = filter === f.key;
						return (
							<button
								key={f.key}
								type="button"
								aria-pressed={active}
								onClick={() => setFilter(f.key)}
								className="shrink-0 cursor-pointer whitespace-nowrap rounded-full px-[14px] py-[6px] font-bold text-[11px] transition-colors duration-200 motion-reduce:transition-none"
								style={
									active
										? {
												background: GOLD,
												color: "#05050E",
												border: `1px solid ${GOLD}`,
											}
										: {
												background: "transparent",
												color: "rgba(14,20,32,0.45)",
												border: "1px solid rgba(14,20,32,0.12)",
											}
								}
							>
								{f.label}
							</button>
						);
					})}
				</div>
			</header>

			<div className="px-[18px] pt-[14px] pb-20">
				{/* ── Live members strip ── */}
				<LiveMembers live={live} />

				{/* ── Community support block (forums, trending, Signal board, ask) ── */}
				<CommunitySupportBlock viewerId={viewer.userId} />

				{/* ── Accountability partners ── */}
				{partners.length > 0 && (
					<AccountabilityCard
						partners={partners}
						focusMap={focusMap}
						connected={connected}
						onConnect={connectPartner}
					/>
				)}

				{/* ── Feed ── */}
				{loading ? (
					<FeedSkeleton />
				) : error ? (
					<ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
				) : posts.length === 0 ? (
					<EmptyState onPost={() => setSheetOpen(true)} />
				) : (
					<>
						{posts.map((p) => (
							<PostCard
								key={p.id}
								post={p}
								focusMap={focusMap}
								onLike={() => void toggleLike(p.id)}
							/>
						))}
						{loadingMore && <FeedSkeleton compact />}
						<div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
					</>
				)}
			</div>

			{sheetOpen && (
				<PostSheet
					viewer={viewer}
					onClose={() => setSheetOpen(false)}
					onPosted={handlePosted}
				/>
			)}
		</div>
	);
}

// ── Live members strip ───────────────────────────────────────────────────────
function LiveMembers({ live }: { live: LiveStrip }) {
	return (
		<div
			className="mb-[14px] flex items-center gap-[8px] rounded-[14px] border bg-white p-[10px_14px]"
			style={{
				borderColor: "rgba(14,20,32,0.07)",
			}}
		>
			<div className="flex items-center" aria-hidden="true">
				{live.avatars.map((a, i) => (
					<span
						key={a.id}
						className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-[2px] border-white font-black text-[10px] ${
							i > 0 ? "-ml-[6px]" : ""
						}`}
						style={{ background: `${a.hue}33`, color: TEXT }}
					>
						{a.initial}
					</span>
				))}
			</div>
			<p
				className="flex-1 font-semibold text-[11px] leading-[1.4]"
				style={{ color: "rgba(14,20,32,0.55)" }}
			>
				<span className="font-[800]" style={{ color: TEXT }}>
					{live.count}
				</span>{" "}
				young professionals active now across{" "}
				<span className="font-[800]" style={{ color: TEXT }}>
					{live.countries}
				</span>{" "}
				countries
			</p>
			<span
				className="cm-pulse h-[7px] w-[7px] shrink-0 rounded-full"
				style={{ background: "#22c55e" }}
			/>
		</div>
	);
}

// ── Accountability partners ──────────────────────────────────────────────────
function AccountabilityCard({
	partners,
	focusMap,
	connected,
	onConnect,
}: {
	partners: Partner[];
	focusMap: FocusMap;
	connected: Set<string>;
	onConnect: (p: Partner) => void;
}) {
	return (
		<section
			className="mb-[14px] rounded-[18px] border p-[16px]"
			style={{
				borderColor: "rgba(62,207,191,0.18)",
				background:
					"linear-gradient(135deg, rgba(62,207,191,0.07), rgba(62,207,191,0.02))",
			}}
		>
			<p
				className="mb-[8px] font-bold text-[9px] uppercase tracking-[0.12em]"
				style={{ color: "rgba(62,207,191,0.7)" }}
			>
				Find Your People
			</p>
			<p className="mb-[3px] font-black text-[14px]" style={{ color: TEXT }}>
				Accountability partners matched to your goal
			</p>
			<p
				className="mb-[12px] text-[11px] leading-relaxed"
				style={{ color: "rgba(14,20,32,0.45)" }}
			>
				Matched on your focus areas and Signal score
			</p>

			<div className="flex flex-col gap-[10px]">
				{partners.map((p) => {
					const hue = focusMap[p.focusAreaIds?.[0] ?? ""]?.hue ?? TEAL;
					const focusLabel = focusMap[p.focusAreaIds?.[0] ?? ""]?.label;
					const isConnected = connected.has(p.userId);
					return (
						<div
							key={p.userId}
							className="rounded-[12px] border p-[10px_12px]"
							style={{
								background: "rgba(255,255,255,0.7)",
								borderColor: "rgba(62,207,191,0.12)",
							}}
						>
							<div className="flex items-center gap-[10px]">
								<span
									className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full font-[800] text-[11px]"
									style={{ background: `${hue}33`, color: TEXT }}
								>
									{initialOf(p.displayName)}
								</span>
								<div className="min-w-0 flex-1">
									<p className="font-bold text-[12px]" style={{ color: TEXT }}>
										{p.displayName ?? "Member"}
									</p>
									<p
										className="text-[10px]"
										style={{ color: "rgba(14,20,32,0.4)" }}
									>
										{[p.country, focusLabel].filter(Boolean).join(" · ") ||
											"On a similar path"}
									</p>
								</div>
								{p.signalScore != null && (
									<span
										className="shrink-0 rounded-full border px-2 py-0.5 font-bold text-[9px]"
										style={{
											color: "#0A8F7F",
											background: "rgba(62,207,191,0.1)",
											borderColor: "rgba(62,207,191,0.18)",
										}}
									>
										Signal {p.signalScore}
									</span>
								)}
							</div>
							<button
								type="button"
								disabled={isConnected}
								onClick={() => onConnect(p)}
								className="mt-[10px] w-full cursor-pointer rounded-[12px] border-none py-[11px] font-bold text-[#05050E] text-[13px] disabled:cursor-default disabled:opacity-60"
								style={{
									background: TEAL,
								}}
							>
								{isConnected ? "Request sent" : "Connect"}
							</button>
						</div>
					);
				})}
			</div>
		</section>
	);
}

// ── Post card ────────────────────────────────────────────────────────────────
function PostCard({
	post,
	focusMap,
	onLike,
}: {
	post: CommunityPost;
	focusMap: FocusMap;
	onLike: () => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const anon = post.isAnonymous;
	const author = post.author;
	const hue = focusMap[author?.focus_area_ids?.[0] ?? ""]?.hue ?? GOLD;
	const focusLabel = focusMap[author?.focus_area_ids?.[0] ?? ""]?.label;
	const name = anon ? "Anonymous" : (author?.display_name ?? "Member");
	const score = anon ? null : (author?.signal_score ?? null);
	const showBoost =
		post.signalBoost ||
		post.likesCount > 20 ||
		(!anon && (author?.signal_score ?? 0) > 70);

	return (
		<article
			className="relative mb-[10px] overflow-hidden rounded-[18px] border p-[16px]"
			style={{
				borderColor: post.featured
					? "rgba(245,200,66,0.2)"
					: "rgba(14,20,32,0.07)",
				background: post.featured ? "rgba(255,252,245,0.8)" : "#FFFFFF",
			}}
		>
			{post.featured && (
				<span
					aria-hidden="true"
					className="absolute top-0 right-0 left-0 h-[2px]"
					style={{
						background: `linear-gradient(to right, ${GOLD}, ${TEAL}, ${VIOLET}, transparent)`,
					}}
				/>
			)}

			{/* Header */}
			<div className="mb-[10px] flex items-start gap-[10px]">
				<span className="relative shrink-0">
					<span
						className="flex h-[36px] w-[36px] items-center justify-center rounded-full font-[800] text-[13px]"
						style={{ background: `${hue}33`, color: TEXT }}
					>
						{anon ? "·" : initialOf(name)}
					</span>
					{score != null && (
						<span
							className="absolute right-[-2px] bottom-[-2px] flex h-[15px] w-[15px] items-center justify-center rounded-full border bg-white text-center font-[800] text-[7px]"
							style={{
								borderColor: "rgba(14,20,32,0.08)",
								color: scoreColor(score),
							}}
						>
							{score}
						</span>
					)}
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="font-black text-[13px]" style={{ color: TEXT }}>
							{name}
						</p>
						{!anon && focusLabel && (
							<span
								className="rounded-full px-[7px] py-[2px] font-bold text-[9px]"
								style={{ background: `${hue}22`, color: TEXT }}
							>
								{focusLabel}
							</span>
						)}
					</div>
					<p className="text-[10px]" style={{ color: "rgba(14,20,32,0.35)" }}>
						{[anon ? null : author?.country, timeAgo(post.createdAt)]
							.filter(Boolean)
							.join(" · ")}
					</p>
				</div>
				<button
					type="button"
					aria-label="Post options"
					className="-mt-1 cursor-pointer p-1"
				>
					<MoreIcon />
				</button>
			</div>

			{/* Category badge */}
			<CategoryBadge category={post.category} />

			{/* Body — per-category presentation */}
			{post.category === "win" ? (
				<div
					className="mb-[10px] flex items-start gap-[8px] rounded-[12px] border p-[10px_12px]"
					style={{
						borderColor: "rgba(245,200,66,0.18)",
						background:
							"linear-gradient(135deg, rgba(245,200,66,0.08), rgba(245,200,66,0.02))",
					}}
				>
					<span
						className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
						style={{ background: "rgba(245,200,66,0.15)" }}
					>
						<StarIcon color={GOLD_INK} />
					</span>
					<p
						className="font-bold text-[12px] leading-[1.4]"
						style={{ color: "#8A6A00" }}
					>
						{post.title || post.body}
					</p>
				</div>
			) : post.category === "question" ? (
				<div
					className="mb-[10px] rounded-[12px] border p-[10px_12px]"
					style={{
						borderColor: "rgba(124,77,255,0.15)",
						background: "rgba(124,77,255,0.05)",
					}}
				>
					<p
						className="font-bold text-[13px] leading-[1.4]"
						style={{ color: TEXT }}
					>
						{post.title || post.body}
					</p>
					<p
						className="mt-[4px] font-bold text-[10px]"
						style={{ color: "rgba(124,77,255,0.7)" }}
					>
						{post.repliesCount} {post.repliesCount === 1 ? "answer" : "answers"}
					</p>
				</div>
			) : (
				<div className="mb-[10px]">
					{post.title && (
						<h2
							className="mb-[6px] font-black text-[15px] leading-[1.35] tracking-[-0.2px]"
							style={{ color: TEXT }}
						>
							{post.title}
						</h2>
					)}
					<p
						className={`text-[12px] leading-[1.6] ${expanded ? "" : "line-clamp-3"}`}
						style={{ color: "rgba(14,20,32,0.6)" }}
					>
						{post.body}
					</p>
					{!expanded && post.body.length > 160 && (
						<button
							type="button"
							onClick={() => setExpanded(true)}
							className="mt-1 cursor-pointer font-bold text-[11px]"
							style={{ color: GOLD_INK }}
						>
							Read more
						</button>
					)}
				</div>
			)}

			{/* Footer */}
			<div className="mt-[2px] flex items-center gap-0">
				<button
					type="button"
					aria-label={post.liked ? "Unlike" : "Like"}
					aria-pressed={post.liked}
					onClick={onLike}
					className="flex cursor-pointer items-center gap-[5px] rounded-[20px] px-[12px] py-[6px] transition-colors duration-200 motion-reduce:transition-none"
				>
					<HeartIcon liked={post.liked} />
					<span
						className="font-semibold text-[11px]"
						style={{ color: post.liked ? GOLD_INK : "rgba(14,20,32,0.45)" }}
					>
						{post.likesCount}
					</span>
				</button>
				<button
					type="button"
					aria-label="Reply"
					className="flex cursor-pointer items-center gap-[5px] rounded-[20px] px-[12px] py-[6px]"
				>
					<ReplyIcon />
					<span
						className="font-semibold text-[11px]"
						style={{ color: "rgba(14,20,32,0.45)" }}
					>
						Reply · {post.repliesCount}
					</span>
				</button>
				{showBoost && (
					<span
						className="ml-auto flex items-center gap-[4px] rounded-full border px-2 py-0.5 font-bold text-[9px]"
						style={{
							color: "rgba(62,207,191,0.7)",
							background: "rgba(62,207,191,0.07)",
							borderColor: "rgba(62,207,191,0.15)",
						}}
					>
						<BoostIcon />
						Signal boost
					</span>
				)}
			</div>
		</article>
	);
}

// ── Category badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: Category }) {
	const cfg: Record<
		Category,
		{ label: string; color: string; bg: string; icon: React.ReactNode }
	> = {
		win: {
			label: "Win",
			color: "#8A6A00",
			bg: "rgba(245,200,66,0.1)",
			icon: <StarIcon color={GOLD_INK} />,
		},
		question: {
			label: "Question",
			color: "#5B43E0",
			bg: "rgba(124,77,255,0.1)",
			icon: <InfoIcon color={VIOLET_INK} />,
		},
		accountability: {
			label: "Accountability",
			color: "#0A8F7F",
			bg: "rgba(62,207,191,0.1)",
			icon: <HandshakeIcon color={TEAL_INK} />,
		},
		opportunity: {
			label: "Opportunity",
			color: "#8A6A00",
			bg: "rgba(245,200,66,0.1)",
			icon: <BriefcaseIcon color={GOLD_INK} />,
		},
		general: {
			label: "General",
			color: "rgba(14,20,32,0.5)",
			bg: "rgba(14,20,32,0.05)",
			icon: null,
		},
	};
	const c = cfg[category];
	return (
		<span
			className="mb-[8px] inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] font-bold text-[9px] uppercase tracking-[0.06em]"
			style={{ background: c.bg, color: c.color }}
		>
			{c.icon}
			{c.label}
		</span>
	);
}

// ── Post creation sheet ──────────────────────────────────────────────────────
function PostSheet({
	viewer,
	onClose,
	onPosted,
}: {
	viewer: Viewer;
	onClose: () => void;
	onPosted: (post: CommunityPost) => void;
}) {
	const [category, setCategory] = useState<Category | null>(null);
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [anon, setAnon] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const titleId = useId();
	const bodyId = useId();

	const canSubmit = body.trim().length > 0 && category != null && !submitting;

	async function submit() {
		if (!canSubmit || !category) return;
		setSubmitting(true);
		try {
			const { data, error } = await supabase
				.from("peer_posts")
				.insert({
					user_id: viewer.userId,
					category,
					title: title.trim() || null,
					body: body.trim(),
					is_anonymous: anon,
				})
				.select(POST_COLS)
				.single();
			if (error || !data) throw error ?? new Error("insert failed");
			const row = data as PostRow;
			onPosted({
				id: row.id,
				userId: row.user_id,
				category: row.category,
				title: row.title,
				body: row.body,
				isAnonymous: row.is_anonymous,
				likesCount: 0,
				repliesCount: 0,
				signalBoost: false,
				createdAt: row.created_at,
				author: {
					user_id: viewer.userId,
					display_name: viewer.displayName,
					country: null,
					focus_area_ids: viewer.focusAreaIds,
					signal_score: viewer.signalScore,
				},
				liked: false,
				featured: false,
			});
		} catch {
			setSubmitting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end">
			<button
				type="button"
				aria-label="Close"
				onClick={onClose}
				className="absolute inset-0 cursor-default"
				style={{ background: "rgba(14,20,32,0.4)" }}
			/>
			<div
				className="cm-sheet relative w-full rounded-t-[24px] bg-white p-5"
				role="dialog"
				aria-modal="true"
				aria-label="Share with the community"
			>
				<p className="font-black text-[16px]" style={{ color: TEXT }}>
					Share with the community
				</p>
				<p
					className="mb-[16px] text-[11px]"
					style={{ color: "rgba(14,20,32,0.4)" }}
				>
					Your Signal score is shown with your post
				</p>

				{/* Category */}
				<div className="mb-[14px] flex flex-wrap gap-[6px]">
					{POST_CATEGORIES.map((c) => {
						const on = category === c.key;
						return (
							<button
								key={c.key}
								type="button"
								aria-pressed={on}
								onClick={() => setCategory(c.key)}
								className="cursor-pointer rounded-full px-[14px] py-[6px] font-bold text-[11px] transition-colors duration-200 motion-reduce:transition-none"
								style={
									on
										? {
												background: GOLD,
												color: "#05050E",
												border: `1px solid ${GOLD}`,
											}
										: {
												background: "transparent",
												color: "rgba(14,20,32,0.45)",
												border: "1px solid rgba(14,20,32,0.12)",
											}
								}
							>
								{c.label}
							</button>
						);
					})}
				</div>

				<label htmlFor={titleId} className="sr-only">
					Title (optional)
				</label>
				<input
					id={titleId}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Add a title (optional)"
					className="mb-[10px] w-full rounded-[12px] border px-[14px] py-[11px] text-[13px] outline-none placeholder:text-[rgba(14,20,32,0.2)]"
					style={{
						background: "rgba(14,20,32,0.03)",
						borderColor: "rgba(14,20,32,0.08)",
						color: TEXT,
					}}
				/>

				<label htmlFor={bodyId} className="sr-only">
					Your post
				</label>
				<textarea
					id={bodyId}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					placeholder="Share your win, ask your question, or describe what you need..."
					className="mb-[14px] min-h-[100px] w-full resize-none rounded-[12px] border px-[14px] py-[11px] text-[13px] outline-none placeholder:text-[rgba(14,20,32,0.2)]"
					style={{
						background: "rgba(14,20,32,0.03)",
						borderColor: "rgba(14,20,32,0.08)",
						color: TEXT,
					}}
				/>

				{/* Anonymous toggle */}
				<div className="mb-[14px] flex items-center justify-between">
					<div>
						<p className="font-bold text-[12px]" style={{ color: TEXT }}>
							Post anonymously
						</p>
						<p className="text-[10px]" style={{ color: "rgba(14,20,32,0.4)" }}>
							Your Signal score won't be shown
						</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={anon}
						aria-label="Post anonymously"
						onClick={() => setAnon((v) => !v)}
						className="relative h-[26px] w-[46px] cursor-pointer rounded-full transition-colors duration-200 motion-reduce:transition-none"
						style={{ background: anon ? VIOLET : "rgba(14,20,32,0.1)" }}
					>
						<span
							className="absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white transition-[left] duration-200 motion-reduce:transition-none"
							style={{ left: anon ? "23px" : "3px" }}
						/>
					</button>
				</div>

				<button
					type="button"
					disabled={!canSubmit}
					onClick={() => void submit()}
					className="w-full cursor-pointer rounded-[14px] border-none py-[14px] font-black text-[#05050E] text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
					style={{
						background: GOLD,
					}}
				>
					{submitting ? "Posting…" : "Post to Community"}
				</button>
			</div>
		</div>
	);
}

// ── Skeleton / empty / error ─────────────────────────────────────────────────
function FeedSkeleton({ compact = false }: { compact?: boolean }) {
	const rows = compact ? [0] : [0, 1, 2];
	return (
		<>
			{rows.map((i) => (
				<div
					key={i}
					className="mb-[10px] animate-pulse rounded-[18px] border bg-white p-[16px] motion-reduce:animate-none"
					style={{ borderColor: "rgba(14,20,32,0.07)" }}
				>
					<div className="mb-[10px] flex items-center gap-[10px]">
						<div
							className="h-[36px] w-[36px] rounded-full"
							style={{ background: "rgba(14,20,32,0.07)" }}
						/>
						<div className="flex-1">
							<div
								className="mb-1.5 h-[10px] w-1/3 rounded-lg"
								style={{ background: "rgba(14,20,32,0.07)" }}
							/>
							<div
								className="h-[8px] w-1/4 rounded-lg"
								style={{ background: "rgba(14,20,32,0.05)" }}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<div
							className="h-[12px] w-full rounded-lg"
							style={{ background: "rgba(14,20,32,0.05)" }}
						/>
						<div
							className="h-[12px] w-5/6 rounded-lg"
							style={{ background: "rgba(14,20,32,0.05)" }}
						/>
						<div
							className="h-[12px] w-2/3 rounded-lg"
							style={{ background: "rgba(14,20,32,0.05)" }}
						/>
					</div>
				</div>
			))}
		</>
	);
}

function EmptyState({ onPost }: { onPost: () => void }) {
	return (
		<div className="mt-[40px] flex flex-col items-center text-center">
			<svg
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke={GOLD_INK}
				strokeWidth={1.4}
				aria-hidden="true"
				style={{ opacity: 0.2 }}
			>
				<circle cx="12" cy="12" r="10" />
				<path d="M15.5 8.5l-2 5-5 2 2-5z" fill={GOLD_INK} stroke="none" />
			</svg>
			<p
				className="mt-[12px] font-bold text-[16px]"
				style={{ color: "rgba(14,20,32,0.35)" }}
			>
				Nothing here yet
			</p>
			<p
				className="mt-[4px] text-[12px]"
				style={{ color: "rgba(14,20,32,0.25)" }}
			>
				Be the first to post in this category
			</p>
			<button
				type="button"
				onClick={onPost}
				className="mt-[14px] cursor-pointer rounded-[12px] border px-[20px] py-[10px] font-bold text-[12px]"
				style={{
					background: "rgba(245,200,66,0.1)",
					borderColor: "rgba(245,200,66,0.22)",
					color: "#8A6A00",
				}}
			>
				Post something
			</button>
		</div>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="mt-[40px] flex flex-col items-center text-center">
			<p
				className="font-bold text-[15px]"
				style={{ color: "rgba(14,20,32,0.4)" }}
			>
				Couldn't load the feed
			</p>
			<button
				type="button"
				onClick={onRetry}
				className="mt-[12px] cursor-pointer rounded-[12px] border px-[20px] py-[10px] font-bold text-[12px]"
				style={{
					background: "rgba(245,200,66,0.1)",
					borderColor: "rgba(245,200,66,0.22)",
					color: "#8A6A00",
				}}
			>
				Try again
			</button>
		</div>
	);
}

// ── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="rgba(14,20,32,0.5)"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.35-4.35" />
		</svg>
	);
}
function PlusIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="#FFFFFF"
			strokeWidth={2.6}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M12 5v14M5 12h14" />
		</svg>
	);
}
function HeartIcon({ liked }: { liked: boolean }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill={liked ? GOLD_INK : "none"}
			stroke={liked ? GOLD_INK : "rgba(14,20,32,0.35)"}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
		</svg>
	);
}
function ReplyIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="rgba(14,20,32,0.35)"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M9 17l-5-5 5-5" />
			<path d="M4 12h11a5 5 0 0 1 5 5v1" />
		</svg>
	);
}
function BoostIcon() {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 24 24"
			fill="none"
			stroke="rgba(62,207,191,0.7)"
			strokeWidth={2.4}
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
		</svg>
	);
}
function MoreIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="rgba(14,20,32,0.3)"
			aria-hidden="true"
		>
			<circle cx="5" cy="12" r="1.6" />
			<circle cx="12" cy="12" r="1.6" />
			<circle cx="19" cy="12" r="1.6" />
		</svg>
	);
}
function StarIcon({ color }: { color: string }) {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill={color}
			aria-hidden="true"
		>
			<path d="M12 2l2.6 6.9L22 9.6l-5.5 4.6L18.2 22 12 17.8 5.8 22l1.7-7.8L2 9.6l7.4-.7z" />
		</svg>
	);
}
function InfoIcon({ color }: { color: string }) {
	return (
		<svg
			width="11"
			height="11"
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={2.2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4M12 8h.01" />
		</svg>
	);
}
function HandshakeIcon({ color }: { color: string }) {
	return (
		<svg
			width="11"
			height="11"
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M8 13l3 3 5-5 3 3" />
			<path d="M2 12l4-4 4 4M22 12l-4 4" />
		</svg>
	);
}
function BriefcaseIcon({ color }: { color: string }) {
	return (
		<svg
			width="11"
			height="11"
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="7" width="18" height="13" rx="2" />
			<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
		</svg>
	);
}

const ANIM = `
@keyframes cm-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.cm-pulse { animation: cm-pulse 2s ease-in-out infinite; }
@keyframes cm-sheet-up { from { transform: translateY(100%); } to { transform: none; } }
.cm-sheet { animation: cm-sheet-up 300ms ease-out; }
@media (prefers-reduced-motion: reduce) {
  .cm-pulse { animation: none; }
  .cm-sheet { animation: none; }
}
`;
