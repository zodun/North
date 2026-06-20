"use client";

import { useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/auth-client";

// ─────────────────────────────────────────────────────────────────────────────
// Community Hub, Stitch "Signal & Noise" editorial design, WIRED to the real
// peer-community backend. Light canvas, gradient-border composer, glass cards.
// The feed is now a forum: each discussion is a thread row that opens its own
// page (/community/<id>) where the full conversation and reply box live.
//   • compose → peer_posts insert (one discussion per day, server-gated)
//   • list    → forum thread rows linking to the thread page
//   • rail    → real public_profiles members
// Styling uses inline tokens + a scoped <style> (no Play-CDN), so the layout is
// correct before paint and never leaks into other routes.
// ─────────────────────────────────────────────────────────────────────────────

export type CommunityHubPost = {
	id: string;
	category: string;
	title: string | null;
	body: string;
	authorName: string;
	authorInitial: string;
	authorDetail: string | null;
	flag?: string;
	likesCount: number;
	repliesCount: number;
	liked: boolean;
	createdAt: string;
};
export type CommunityHubMember = {
	id: string;
	initial: string;
	name: string;
	flag?: string;
	detail: string;
	samePath: boolean;
};

const PRIMARY = "#005ac2";
const ON_SURFACE = "#131313";
const ON_VARIANT = "#424754";
const SERIF = "'Libre Caslon Text', Georgia, serif";
const SANS = "'Sora', system-ui, sans-serif";
const FONT_SHEET =
	"https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap";
const ICON_SHEET =
	"https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block";

export const CATEGORIES: { key: string; label: string; color: string }[] = [
	{ key: "win", label: "Win", color: "#0E9E73" },
	{ key: "question", label: "Question", color: PRIMARY },
	{ key: "accountability", label: "Accountability", color: "#ee9800" },
	{ key: "opportunity", label: "Opportunity", color: "#7B61FF" },
	{ key: "general", label: "General", color: ON_VARIANT },
];
export const catMeta = (key: string) =>
	CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[4];

const NAV = [
	{ href: "/for-you", label: "For You", icon: "auto_awesome" },
	{ href: "/mission", label: "Mission", icon: "target" },
	{ href: "/opportunities", label: "Opportunities", icon: "trending_up" },
	{ href: "/journal", label: "Journal", icon: "menu_book" },
	{ href: "/community", label: "Community", icon: "group" },
];

// Short relative time for the thread rows ("3h", "2d"), so the forum reads as
// active without a heavy date library.
function timeAgo(iso: string): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "";
	const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
	if (s < 60) return "now";
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	const d = Math.floor(h / 24);
	if (d < 7) return `${d}d`;
	return `${Math.floor(d / 7)}w`;
}

export function CommunityHub({
	userId,
	displayName,
	initialPosts,
	members,
	memberCount,
	greeting,
	firstName,
	focusLabel,
	samePathCount,
	canPostToday,
}: {
	userId: string;
	displayName: string;
	initialPosts: CommunityHubPost[];
	members: CommunityHubMember[];
	memberCount: number;
	greeting: string;
	firstName: string;
	focusLabel: string | null;
	samePathCount: number;
	canPostToday: boolean;
}) {
	const [posts, setPosts] = useState(initialPosts);
	const [filter, setFilter] = useState<string>("all");
	// One discussion a day; flips off after a successful post (or a rejected one).
	const [canPost, setCanPost] = useState(canPostToday);

	// Inline composer state.
	const [category, setCategory] = useState("general");
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [anon, setAnon] = useState(false);
	const [busy, setBusy] = useState(false);
	const bodyRef = useRef<HTMLTextAreaElement | null>(null);

	const name = firstName && firstName !== "there" ? firstName : null;
	const tail = name ? `, ${name}` : "";

	function focusComposer() {
		bodyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
		bodyRef.current?.focus();
	}

	async function submitPost() {
		if (!body.trim() || busy || !canPost) return;
		setBusy(true);
		const { data, error } = await supabase
			.from("peer_posts")
			.insert({
				user_id: userId,
				category,
				title: title.trim() || null,
				body: body.trim(),
				is_anonymous: anon,
			})
			.select("id, category, title, body")
			.single();
		setBusy(false);
		if (error || !data) {
			// The daily-limit trigger rejects a second post; close the composer so
			// the one-a-day notice takes over instead of showing a raw error.
			if (error) setCanPost(false);
			return;
		}
		// Used today's discussion; replies on the thread pages stay open.
		setCanPost(false);
		const author = anon ? "Anonymous" : displayName;
		setPosts((prev) => [
			{
				id: data.id as string,
				category: data.category as string,
				title: (data.title as string | null) ?? null,
				body: data.body as string,
				authorName: author,
				authorInitial: (author[0] ?? "·").toUpperCase(),
				authorDetail: null,
				likesCount: 0,
				repliesCount: 0,
				liked: false,
				createdAt: new Date().toISOString(),
			},
			...prev,
		]);
		setTitle("");
		setBody("");
		setAnon(false);
		setCategory("general");
	}

	const visiblePosts = useMemo(
		() =>
			filter === "all" ? posts : posts.filter((p) => p.category === filter),
		[posts, filter],
	);

	const sub =
		focusLabel && samePathCount > 0
			? `${samePathCount} ${samePathCount === 1 ? "person is" : "people are"} exploring ${focusLabel} alongside you. Share a win, or ask for help.`
			: "Wins, questions, and accountability from people moving in the same direction as you.";

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
				<TopBar memberCount={memberCount} samePathCount={samePathCount} />
				{/* Soft Sky colour wash, blue, teal and a whisper of gold light the
				    top of the canvas without competing with the cards. */}
				<div aria-hidden="true" className="cm-aura" />
				<div className="relative z-[1] px-5 pb-6 sm:px-6 lg:px-8">
					{/* ── Page header ─────────────────────────────────────────── */}
					<header className="cm-rise mx-auto mt-4 mb-10 max-w-6xl">
						<span
							className="mb-2 block font-bold text-[11px] uppercase tracking-[0.2em]"
							style={{ color: PRIMARY }}
						>
							{greeting}
							{name ? `, ${name}` : ""}
						</span>
						<div className="flex flex-wrap items-end justify-between gap-4">
							<h1
								className="max-w-2xl font-bold text-4xl leading-tight tracking-tight sm:text-5xl"
								style={{ fontFamily: SERIF }}
							>
								You are not building alone.
							</h1>
							<div className="flex gap-2 sm:hidden">
								<Pill tone="primary">{memberCount} members</Pill>
								{samePathCount > 0 && (
									<Pill tone="muted">{samePathCount} on your path</Pill>
								)}
							</div>
						</div>
						<p
							className="mt-3 max-w-2xl text-sm"
							style={{ color: ON_VARIANT, opacity: 0.75 }}
						>
							{sub}
						</p>
					</header>

					{/* ── Composer (one discussion a day) ─────────────────────── */}
					<section className="mx-auto mb-16 max-w-4xl">
						{canPost ? (
							<div
								className="cm-rise glass-gradient-border signal-glow-primary rounded-[2rem] p-7 sm:p-10"
								style={{ animationDelay: "60ms" }}
							>
								<div className="mb-6 flex items-start justify-between gap-4">
									<div>
										<span
											className="mb-1.5 block font-bold text-[11px] uppercase tracking-[0.2em]"
											style={{ color: PRIMARY }}
										>
											Start a discussion
										</span>
										<h3
											className="font-bold text-2xl tracking-tight"
											style={{ fontFamily: SERIF }}
										>
											What's on your mind{tail}?
										</h3>
									</div>
									<button
										type="button"
										onClick={() => setAnon((v) => !v)}
										aria-pressed={anon}
										className="flex shrink-0 items-center gap-1.5 font-bold text-[11px] uppercase tracking-widest transition-colors"
										style={{ color: anon ? PRIMARY : ON_VARIANT }}
									>
										<span className="material-symbols-outlined text-lg">
											{anon ? "toggle_on" : "toggle_off"}
										</span>
										Anonymous
									</button>
								</div>

								<input
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Give your discussion a title"
									maxLength={120}
									className="w-full border-none bg-transparent font-bold text-xl outline-none placeholder:text-black/25"
									style={{ fontFamily: SERIF, color: ON_SURFACE }}
								/>
								<textarea
									ref={bodyRef}
									value={body}
									onChange={(e) => setBody(e.target.value)}
									placeholder="Share a win, ask a question, or set an intention…"
									maxLength={2000}
									rows={4}
									className="mt-2 min-h-[120px] w-full resize-none border-none bg-transparent text-base leading-relaxed outline-none placeholder:text-black/30"
									style={{ color: ON_SURFACE }}
								/>

								<div className="mt-5 flex flex-wrap gap-2">
									{CATEGORIES.map((c) => {
										const active = category === c.key;
										return (
											<button
												key={c.key}
												type="button"
												onClick={() => setCategory(c.key)}
												className="rounded-full border px-4 py-2 font-bold text-[11px] uppercase tracking-wider transition-colors"
												style={
													active
														? {
																background: `${c.color}1f`,
																color: c.color,
																borderColor: `${c.color}40`,
															}
														: {
																color: ON_VARIANT,
																background: "rgba(255,255,255,0.4)",
																borderColor: "rgba(0,0,0,0.08)",
															}
												}
											>
												{c.label}
											</button>
										);
									})}
								</div>

								<div className="mt-7 flex items-center justify-between gap-4 border-black/5 border-t pt-7">
									<span
										className="text-xs"
										style={{ color: ON_VARIANT, opacity: 0.6 }}
									>
										{anon
											? "Posting anonymously."
											: "One discussion a day, make it count."}
									</span>
									<button
										type="button"
										onClick={() => void submitPost()}
										disabled={!body.trim() || busy}
										className="rounded-xl px-9 py-3.5 font-bold text-sm text-white uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
										style={{
											background: PRIMARY,
											boxShadow: "0 10px 30px rgba(0,90,194,0.25)",
										}}
									>
										{busy ? "Posting…" : "Post"}
									</button>
								</div>
							</div>
						) : (
							<DailyLimitNotice tail={tail} />
						)}
					</section>

					{/* ── Discussions (forum) + rail ──────────────────────────── */}
					<section className="mx-auto max-w-6xl">
						<div className="grid grid-cols-12 gap-6">
							<div className="col-span-12 lg:col-span-8">
								<div className="mb-6">
									<span
										className="mb-2 block font-bold text-[11px] uppercase tracking-[0.2em]"
										style={{ color: ON_VARIANT, opacity: 0.55 }}
									>
										The community
									</span>
									<h2
										className="font-bold text-3xl tracking-tight"
										style={{ fontFamily: SERIF }}
									>
										Discussions
									</h2>
									<div className="mt-5 flex flex-wrap gap-2">
										<FilterPill
											active={filter === "all"}
											onClick={() => setFilter("all")}
											label="All"
										/>
										{CATEGORIES.map((c) => (
											<FilterPill
												key={c.key}
												active={filter === c.key}
												onClick={() => setFilter(c.key)}
												label={c.label}
											/>
										))}
									</div>
								</div>

								{visiblePosts.length > 0 ? (
									<div className="space-y-3">
										{visiblePosts.map((p) => (
											<ThreadRow key={p.id} post={p} />
										))}
									</div>
								) : (
									<EmptyFeed
										filtered={filter !== "all"}
										onStart={focusComposer}
									/>
								)}
							</div>

							{/* Right rail */}
							<aside className="col-span-12 space-y-6 lg:col-span-4">
								<div className="glass-panel rounded-[2rem] p-7">
									<h3 className="mb-5 font-bold text-base">Active now</h3>
									{members.length > 0 ? (
										<div className="space-y-4">
											{members.map((m) => (
												<div key={m.id} className="flex items-center gap-3">
													<span className="relative">
														<span
															className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm"
															style={{
																background: "rgba(0,90,194,0.1)",
																color: PRIMARY,
															}}
														>
															{m.initial}
														</span>
														<span
															className="cm-presence absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white"
															style={{ background: "#34c759" }}
														/>
													</span>
													<div className="min-w-0 flex-1">
														<p className="flex items-center gap-1.5 truncate font-bold text-sm">
															{m.name}
															{m.flag && (
																<span aria-hidden="true">{m.flag}</span>
															)}
															{m.samePath && (
																<span
																	className="rounded-full px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider"
																	style={{
																		background: "rgba(0,90,194,0.1)",
																		color: PRIMARY,
																	}}
																>
																	Same path
																</span>
															)}
														</p>
														<p
															className="truncate text-xs"
															style={{ color: ON_VARIANT, opacity: 0.7 }}
														>
															{m.detail}
														</p>
													</div>
												</div>
											))}
										</div>
									) : (
										<p
											className="text-sm"
											style={{ color: ON_VARIANT, opacity: 0.7 }}
										>
											No one else here yet. Be the first to post.
										</p>
									)}
								</div>

								<div
									className="signal-glow-primary rounded-[2rem] p-7"
									style={{
										background:
											"linear-gradient(135deg, rgba(0,90,194,0.08) 0%, rgba(62,207,191,0.12) 100%)",
										border: "1px solid rgba(0,90,194,0.12)",
									}}
								>
									<span
										className="mb-2 block font-bold text-[11px] uppercase tracking-[0.2em]"
										style={{ color: PRIMARY }}
									>
										Your space
									</span>
									<p
										className="font-bold text-lg leading-snug"
										style={{ fontFamily: SERIF }}
									>
										Share a win or ask for help.
									</p>
									<p
										className="mt-1 text-sm"
										style={{ color: ON_VARIANT, opacity: 0.75 }}
									>
										Every discussion is a step, for you and for someone reading
										it.
									</p>
									<button
										type="button"
										onClick={focusComposer}
										className="mt-4 rounded-xl px-5 py-2.5 font-bold text-white text-xs uppercase tracking-wider transition-all active:scale-95"
										style={{ background: PRIMARY }}
									>
										Start a discussion
									</button>
								</div>
							</aside>
						</div>
					</section>
				</div>
			</div>

			{/* Floating compose (mobile), jumps to the inline composer. */}
			<button
				type="button"
				onClick={focusComposer}
				aria-label="Start a discussion"
				className="fixed right-6 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform active:scale-95 md:hidden"
				style={{
					background: PRIMARY,
					boxShadow: "0 12px 30px rgba(0,90,194,0.4)",
				}}
			>
				<span className="material-symbols-outlined text-2xl">edit</span>
			</button>
		</div>
	);
}

function Pill({
	tone,
	children,
}: {
	tone: "primary" | "muted";
	children: React.ReactNode;
}) {
	return (
		<span
			className="rounded-full border px-3 py-1 font-bold text-[10px] uppercase tracking-wider"
			style={
				tone === "primary"
					? {
							color: PRIMARY,
							background: "rgba(0,90,194,0.06)",
							borderColor: "rgba(0,90,194,0.12)",
						}
					: {
							color: ON_VARIANT,
							opacity: 0.7,
							background: "transparent",
							borderColor: "rgba(0,0,0,0.08)",
						}
			}
		>
			{children}
		</span>
	);
}

function FilterPill({
	active,
	onClick,
	label,
}: {
	active: boolean;
	onClick: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded-full border px-5 py-2 font-bold text-xs uppercase tracking-wider transition-colors"
			style={
				active
					? {
							background: PRIMARY,
							color: "#fff",
							borderColor: PRIMARY,
							boxShadow: "0 4px 12px rgba(0,90,194,0.25)",
						}
					: { color: ON_VARIANT, borderColor: "rgba(0,0,0,0.08)" }
			}
		>
			{label}
		</button>
	);
}

// A forum thread row: the discussion at a glance (category, author, title, a
// one-line preview, reply/like counts, age) linking to its own thread page.
function ThreadRow({ post }: { post: CommunityHubPost }) {
	const cat = catMeta(post.category);
	const heading = post.title ?? post.body;
	const preview = post.title ? post.body : null;
	const age = timeAgo(post.createdAt);
	return (
		<a
			href={`/community/${post.id}`}
			className="cm-rise glass-panel group block rounded-2xl p-5 sm:p-6"
		>
			<div className="flex items-start gap-4">
				<span
					className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold"
					style={{ background: `${cat.color}1f`, color: cat.color }}
				>
					{post.authorInitial}
				</span>
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex flex-wrap items-center gap-2">
						<span
							className="rounded-full px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider"
							style={{ background: `${cat.color}1f`, color: cat.color }}
						>
							{cat.label}
						</span>
						<span className="font-bold text-sm">{post.authorName}</span>
						{post.flag && <span aria-hidden="true">{post.flag}</span>}
						{age && (
							<span
								className="text-xs"
								style={{ color: ON_VARIANT, opacity: 0.5 }}
							>
								{age}
							</span>
						)}
					</div>
					<h3
						className="line-clamp-2 font-bold text-lg leading-snug"
						style={{ fontFamily: SERIF }}
					>
						{heading}
					</h3>
					{preview && (
						<p
							className="mt-0.5 line-clamp-1 text-sm"
							style={{ color: ON_VARIANT, opacity: 0.8 }}
						>
							{preview}
						</p>
					)}
					<div
						className="mt-3 flex items-center gap-5 text-xs"
						style={{ color: ON_VARIANT, opacity: 0.7 }}
					>
						<span className="flex items-center gap-1.5">
							<span className="material-symbols-outlined text-base">
								chat_bubble
							</span>
							{post.repliesCount}
						</span>
						<span className="flex items-center gap-1.5">
							<span className="material-symbols-outlined text-base">
								favorite
							</span>
							{post.likesCount}
						</span>
						<span
							className="ml-auto font-bold uppercase tracking-wider transition-colors group-hover:text-[#005ac2]"
							style={{ color: PRIMARY }}
						>
							Open thread →
						</span>
					</div>
				</div>
			</div>
		</a>
	);
}

function DailyLimitNotice({ tail }: { tail: string }) {
	return (
		<div
			className="cm-rise glass-panel rounded-[2rem] p-7 text-center sm:p-10"
			style={{ animationDelay: "60ms" }}
		>
			<span
				className="material-symbols-outlined text-4xl"
				style={{ color: PRIMARY, opacity: 0.5 }}
			>
				check_circle
			</span>
			<h3
				className="mt-3 font-bold text-2xl tracking-tight"
				style={{ fontFamily: SERIF }}
			>
				You've started today's discussion{tail}.
			</h3>
			<p
				className="mx-auto mt-2 max-w-md text-sm"
				style={{ color: ON_VARIANT, opacity: 0.8 }}
			>
				One a day keeps it considered. Come back tomorrow to start another. In
				the meantime, open a thread below and join the conversation, replies are
				always open.
			</p>
		</div>
	);
}

function EmptyFeed({
	filtered,
	onStart,
}: {
	filtered: boolean;
	onStart: () => void;
}) {
	return (
		<div className="glass-panel rounded-[2rem] p-12 text-center">
			<span
				className="material-symbols-outlined text-5xl"
				style={{ color: PRIMARY, opacity: 0.35 }}
			>
				forum
			</span>
			<p className="mt-3 font-bold text-xl" style={{ fontFamily: SERIF }}>
				{filtered ? "Nothing here yet" : "No discussions yet"}
			</p>
			<p className="mt-1 text-sm" style={{ color: ON_VARIANT, opacity: 0.7 }}>
				{filtered
					? "No discussions in this category yet. Be the first."
					: "Start the first one, share a win, ask a question, or set an intention."}
			</p>
			<button
				type="button"
				onClick={onStart}
				className="mt-5 rounded-xl px-6 py-3 font-bold text-sm text-white"
				style={{ background: PRIMARY }}
			>
				Start a discussion
			</button>
		</div>
	);
}

function TopBar({
	memberCount,
	samePathCount,
}: {
	memberCount: number;
	samePathCount: number;
}) {
	return (
		<header
			className="sticky top-0 z-40 px-5 py-3 backdrop-blur-md sm:px-6 lg:px-8"
			style={{ background: "rgba(248,249,250,0.7)" }}
		>
			<div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
				<span
					className="font-bold text-xl tracking-tight md:hidden"
					style={{ fontFamily: SERIF, color: ON_SURFACE }}
				>
					Community
				</span>
				<span className="hidden md:block" />
				<div className="flex items-center gap-4">
					<span className="hidden items-center gap-2 sm:flex">
						<Pill tone="primary">{memberCount} members</Pill>
						{samePathCount > 0 && (
							<Pill tone="muted">{samePathCount} on your path</Pill>
						)}
					</span>
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
			</div>
		</header>
	);
}

export function Sidebar() {
	return (
		<aside className="ch-rail px-6 py-8">
			<a
				href="/for-you"
				aria-label="North home"
				className="mb-12 flex items-center gap-3 px-2"
			>
				<svg
					className="h-9 w-9 shrink-0"
					viewBox="0 0 100 100"
					fill={PRIMARY}
					aria-hidden="true"
				>
					<path d="M50 3 L58 42 L97 50 L58 58 L50 97 L42 58 L3 50 L42 42 Z" />
				</svg>
				<span
					className="font-bold text-3xl tracking-tighter"
					style={{ fontFamily: SERIF, color: ON_SURFACE }}
				>
					North
				</span>
			</a>
			<nav className="flex-1 space-y-1">
				{NAV.map((n) => {
					const active = n.href === "/community";
					return (
						<a
							key={n.href}
							href={n.href}
							aria-current={active ? "page" : undefined}
							className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors"
							style={
								active
									? {
											color: PRIMARY,
											fontWeight: 700,
											background: "rgba(0,90,194,0.05)",
										}
									: { color: ON_VARIANT }
							}
						>
							<span
								className="material-symbols-outlined"
								style={
									active
										? { fontVariationSettings: "'FILL' 1, 'wght' 700" }
										: undefined
								}
							>
								{n.icon}
							</span>
							<span
								className="text-sm"
								style={{ fontWeight: active ? 700 : 500 }}
							>
								{n.label}
							</span>
						</a>
					);
				})}
			</nav>
		</aside>
	);
}

export const SCOPED_CSS = `
.material-symbols-outlined {
	font-family: 'Material Symbols Outlined';
	font-weight: normal; font-style: normal; line-height: 1; letter-spacing: normal;
	text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal;
	direction: ltr; -webkit-font-feature-settings: 'liga'; font-feature-settings: 'liga';
	-webkit-font-smoothing: antialiased; width: 1em; overflow: hidden;
}
/* Subtle gradient hairline border on white (matches the Stitch mockup), no
   colored stripe. */
.glass-gradient-border {
	border: 1px solid transparent;
	background:
		linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)) padding-box,
		linear-gradient(135deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.02) 100%) border-box;
	transition: border-color .3s, box-shadow .3s, transform .3s;
}
.glass-gradient-border:hover {
	background:
		linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)) padding-box,
		linear-gradient(135deg, rgba(0,90,194,0.25) 0%, rgba(0,90,194,0.05) 100%) border-box;
	box-shadow: 0 18px 44px rgba(0,0,0,0.07);
	transform: translateY(-2px);
}
.signal-glow-primary { box-shadow: 0 10px 40px rgba(0,90,194,0.10); }
/* Soft Sky colour wash across the top of the canvas: blue, teal and a whisper
   of gold. Sits behind the content (z-0), purely decorative. */
.cm-aura {
	position: absolute; top: 0; left: 0; right: 0; height: 460px; z-index: 0; pointer-events: none;
	background:
		radial-gradient(60% 80% at 12% -12%, rgba(0,90,194,0.12), transparent 60%),
		radial-gradient(50% 75% at 96% -8%, rgba(62,207,191,0.14), transparent 60%),
		radial-gradient(42% 60% at 62% -22%, rgba(245,200,66,0.12), transparent 55%);
}
/* A little flair, calm by default: cards rise in on load and presence dots
   breathe, all disabled under reduced-motion. */
@keyframes cm-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.cm-rise { animation: cm-rise .55s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes cm-pop { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
.cm-heart-liked { animation: cm-pop .35s ease-out; }
@keyframes cm-presence { 0%, 100% { box-shadow: 0 0 0 0 rgba(52,199,89,0.45); } 70% { box-shadow: 0 0 0 5px rgba(52,199,89,0); } }
.cm-presence { animation: cm-presence 2.4s ease-out infinite; }
.glass-panel { background: rgba(255,255,255,0.72); border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 8px 26px rgba(0,0,0,0.04); transition: border-color .3s, box-shadow .3s, transform .3s; }
.glass-panel:hover { border-color: rgba(0,90,194,0.2); box-shadow: 0 16px 38px rgba(0,0,0,0.07); transform: translateY(-2px); }
/* Critical layout, server-rendered: fixed sidebar + content offset before fonts
   load, so content never sits behind the nav. Phones use the bottom tab bar. */
.ch-rail { position: fixed; left: 0; top: 0; height: 100%; width: 280px; z-index: 50; display: none; flex-direction: column; background: rgba(255,255,255,0.85); border-right: 1px solid rgba(0,0,0,0.06); backdrop-filter: blur(12px); }
.ch-main { margin-left: 0; padding-bottom: 7rem; }
@media (min-width: 768px) { .ch-rail { display: flex; } .ch-main { margin-left: 280px; padding-bottom: 2.5rem; } }
@media (prefers-reduced-motion: reduce) {
	.glass-gradient-border, .glass-panel { transition: none; }
	.cm-rise, .cm-heart-liked, .cm-presence { animation: none; opacity: 1; transform: none; }
}
`;
