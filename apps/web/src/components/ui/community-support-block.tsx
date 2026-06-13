"use client";

import {
	MessageCircle,
	Send,
	Sparkles,
	TrendingUp,
	Trophy,
	Users,
} from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useId, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/auth-client";

// 21st.dev-style community-support block, fully re-skinned to North's warm light
// system and wired to real data: trending threads from peer_posts, the Signal
// leaderboard from the public_profiles view, and an Ask form that inserts a
// `question` post. Static forums stay illustrative.

const FORUMS = [
	{ name: "North Discord", url: "#", icon: Users },
	{ name: "Caribbean Professionals", url: "#", icon: Users },
	{ name: "Young Founders Group", url: "#", icon: MessageCircle },
];

// North glass card: warm white, soft white hairline, blur + low shadow.
const GLASS =
	"bg-[rgba(255,255,255,0.72)] backdrop-blur-[16px] shadow-[0_2px_12px_rgba(26,18,8,0.06)]";
const GLASS_BORDER = "1px solid rgba(255,255,255,0.9)";

type Trending = { id: string; title: string; replies: number };
type Leader = {
	userId: string;
	name: string;
	signal: number | null;
	country: string | null;
};

function truncate(s: string, n = 60): string {
	return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export default function CommunitySupportBlock({
	viewerId,
}: {
	viewerId?: string;
}) {
	const [trending, setTrending] = useState<Trending[] | null>(null);
	const [leaders, setLeaders] = useState<Leader[] | null>(null);
	const [askText, setAskText] = useState("");
	const [asking, setAsking] = useState(false);
	const [asked, setAsked] = useState(false);
	const askId = useId();

	const loadTrending = useCallback(async () => {
		const { data } = await supabase
			.from("peer_posts")
			.select("id, title, body, replies_count")
			.order("replies_count", { ascending: false })
			.order("created_at", { ascending: false })
			.limit(3);
		setTrending(
			(data ?? []).map((p) => ({
				id: p.id as string,
				title: truncate(
					((p.title as string | null) || (p.body as string)) ?? "",
				),
				replies: (p.replies_count as number) ?? 0,
			})),
		);
	}, []);

	useEffect(() => {
		void loadTrending();
		void (async () => {
			const { data } = await supabase
				.from("public_profiles")
				.select("user_id, display_name, signal_score, country")
				.order("signal_score", { ascending: false, nullsFirst: false })
				.limit(3);
			setLeaders(
				(data ?? []).map((r) => ({
					userId: r.user_id as string,
					name: (r.display_name as string | null) ?? "Member",
					signal: (r.signal_score as number | null) ?? null,
					country: (r.country as string | null) ?? null,
				})),
			);
		})();
	}, [loadTrending]);

	async function submitAsk() {
		const body = askText.trim();
		if (!body || asking || !viewerId) return;
		setAsking(true);
		try {
			const { error } = await supabase
				.from("peer_posts")
				.insert({ user_id: viewerId, category: "question", body });
			if (error) throw error;
			setAsked(true);
			setAskText("");
			await loadTrending();
		} catch {
			// leave the text in place so the user can retry
		} finally {
			setAsking(false);
		}
	}

	return (
		<MotionConfig reducedMotion="user">
			<TooltipProvider delayDuration={150}>
				<div className="mb-[14px] flex flex-col gap-[10px] font-jakarta">
					{/* ── Ask the Community ── */}
					<Card className={GLASS} style={{ border: GLASS_BORDER }}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="h-4 w-4" style={{ color: "#C47D00" }} />
								Ask the Community
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<label htmlFor={askId} className="sr-only">
									Ask the community
								</label>
								<Input
									id={askId}
									value={askText}
									onChange={(e) => {
										setAskText(e.target.value);
										if (asked) setAsked(false);
									}}
									onKeyDown={(e) => e.key === "Enter" && void submitAsk()}
									placeholder="Share a win, ask a question, or find accountability..."
								/>
								<Button
									type="button"
									size="icon"
									aria-label="Post to community"
									disabled={!askText.trim() || asking || !viewerId}
									onClick={() => void submitAsk()}
								>
									<Send className="h-4 w-4" />
								</Button>
							</div>
							<AnimatePresence>
								{asked && (
									<motion.p
										initial={{ opacity: 0, y: 4 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										className="mt-2 font-semibold text-[11px]"
										style={{ color: "#0A6458" }}
									>
										Posted — your question is live in the feed.
									</motion.p>
								)}
							</AnimatePresence>
						</CardContent>
					</Card>

					{/* ── Trending ── */}
					<Card className={GLASS} style={{ border: GLASS_BORDER }}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="h-4 w-4" style={{ color: "#0EA596" }} />
								Trending
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-[6px]">
							{trending === null ? (
								<RowSkeletons />
							) : trending.length === 0 ? (
								<p
									className="text-[11px]"
									style={{ color: "rgba(26,18,8,0.4)" }}
								>
									No threads yet — start one above.
								</p>
							) : (
								trending.map((t) => (
									<button
										key={t.id}
										type="button"
										className="flex w-full items-center gap-3 rounded-[14px] border px-[12px] py-[9px] text-left transition-colors hover:bg-[rgba(245,240,232,0.8)] motion-reduce:transition-none"
										style={{ borderColor: "rgba(26,18,8,0.08)" }}
									>
										<span
											className="min-w-0 flex-1 truncate font-semibold text-[12px]"
											style={{ color: "#1A1208" }}
										>
											{t.title}
										</span>
										<span
											className="shrink-0 rounded-full px-2 py-0.5 font-bold text-[10px]"
											style={{
												background: "rgba(196,125,0,0.1)",
												color: "#8B5500",
											}}
										>
											{t.replies}
										</span>
									</button>
								))
							)}
						</CardContent>
					</Card>

					{/* ── Signal leaderboard ── */}
					<Card className={GLASS} style={{ border: GLASS_BORDER }}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Trophy className="h-4 w-4" style={{ color: "#C47D00" }} />
								Top Signal this week
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-[8px]">
							{leaders === null ? (
								<RowSkeletons rows={3} avatar />
							) : leaders.length === 0 ? (
								<p
									className="text-[11px]"
									style={{ color: "rgba(26,18,8,0.4)" }}
								>
									Signal scores appear after members complete a full week.
								</p>
							) : (
								leaders.map((l, i) => (
									<div key={l.userId} className="flex items-center gap-[10px]">
										<span
											className="w-[14px] text-center font-black text-[11px]"
											style={{ color: "rgba(26,18,8,0.3)" }}
										>
											{i + 1}
										</span>
										<Avatar className="h-[30px] w-[30px]">
											<AvatarFallback
												style={{
													background: "rgba(196,125,0,0.16)",
													color: "#8B5500",
												}}
											>
												{l.name[0]?.toUpperCase() ?? "·"}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<p
												className="truncate font-bold text-[12px]"
												style={{ color: "#1A1208" }}
											>
												{l.name}
											</p>
											{l.country && (
												<p
													className="truncate text-[10px]"
													style={{ color: "rgba(26,18,8,0.4)" }}
												>
													{l.country}
												</p>
											)}
										</div>
										{l.signal != null && (
											<Tooltip>
												<TooltipTrigger asChild>
													<span
														className="shrink-0 cursor-default rounded-full border px-2 py-0.5 font-bold text-[10px]"
														style={{
															color: "#0A6458",
															background: "rgba(14,165,150,0.1)",
															borderColor: "rgba(14,165,150,0.18)",
														}}
													>
														{l.signal} Signal
													</span>
												</TooltipTrigger>
												<TooltipContent>Weekly Signal score</TooltipContent>
											</Tooltip>
										)}
									</div>
								))
							)}
						</CardContent>
					</Card>

					{/* ── Communities ── */}
					<Card className={GLASS} style={{ border: GLASS_BORDER }}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-4 w-4" style={{ color: "#7C4DFF" }} />
								Communities
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-[6px]">
							{FORUMS.map((f) => {
								const Icon = f.icon;
								return (
									<button
										key={f.name}
										type="button"
										className="flex w-full items-center gap-3 rounded-[14px] border px-[12px] py-[9px] text-left transition-colors hover:bg-[rgba(245,240,232,0.8)] motion-reduce:transition-none"
										style={{ borderColor: "rgba(26,18,8,0.08)" }}
									>
										<span
											className="flex h-7 w-7 items-center justify-center rounded-full"
											style={{ background: "rgba(245,240,232,0.8)" }}
										>
											<Icon
												className="h-[14px] w-[14px]"
												style={{ color: "#C47D00" }}
											/>
										</span>
										<span
											className="font-semibold text-[12px]"
											style={{ color: "#1A1208" }}
										>
											{f.name}
										</span>
									</button>
								);
							})}
						</CardContent>
					</Card>
				</div>
			</TooltipProvider>
		</MotionConfig>
	);
}

// ── Skeleton rows ────────────────────────────────────────────────────────────
function RowSkeletons({
	rows = 3,
	avatar = false,
}: {
	rows?: number;
	avatar?: boolean;
}) {
	return (
		<>
			{Array.from({ length: rows }, (_, i) => i).map((i) => (
				<div
					key={i}
					className="flex animate-pulse items-center gap-[10px] motion-reduce:animate-none"
				>
					{avatar && (
						<span
							className="h-[30px] w-[30px] rounded-full"
							style={{ background: "rgba(26,18,8,0.07)" }}
						/>
					)}
					<span
						className="h-[12px] flex-1 rounded-lg"
						style={{ background: "rgba(26,18,8,0.06)" }}
					/>
					<span
						className="h-[12px] w-[34px] rounded-full"
						style={{ background: "rgba(26,18,8,0.05)" }}
					/>
				</div>
			))}
		</>
	);
}
