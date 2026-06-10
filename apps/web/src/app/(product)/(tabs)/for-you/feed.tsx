"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/auth-client";

type Item = {
	id: string;
	kind: string;
	title: string;
	eyebrow: string | null;
	body: string | null;
	source: string | null;
	external_url: string | null;
	cloudinary_public_id: string | null;
	thumbnail_url: string | null;
	content_category_id: string | null;
	published_at: string;
};

const KIND_LABELS: Record<string, string> = {
	essay: "Read",
	voice: "Listen",
	story: "Story",
	opportunity: "Open",
	video: "Watch",
};

function youtubeEmbedUrl(url: string): string | null {
	const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
	return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
}

function VideoBackground({ item }: { item: Item }) {
	if (!item.external_url) {
		return (
			<div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#111]" />
		);
	}
	const ytEmbed = youtubeEmbedUrl(item.external_url);
	if (ytEmbed) {
		return (
			<div className="absolute inset-0">
				{item.thumbnail_url && (
					// biome-ignore lint/performance/noImgElement: decorative background with no fixed dimensions
					<img
						src={item.thumbnail_url}
						alt=""
						className="absolute inset-0 h-full w-full object-cover"
					/>
				)}
				<div className="absolute inset-0 bg-black/50" />
			</div>
		);
	}
	return (
		<div className="absolute inset-0">
			<video
				src={item.external_url}
				className="h-full w-full object-cover"
				autoPlay
				muted
				loop
				playsInline
			/>
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
		</div>
	);
}

export function ForYouFeed({
	items,
	initialSaved,
	initialMatters,
}: {
	items: Item[];
	initialSaved: string[];
	initialMatters: string[];
}) {
	const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
	const [matters, setMatters] = useState<Set<string>>(new Set(initialMatters));

	// Keep state in sync if server re-renders with fresh data (e.g. navigation)
	// biome-ignore lint/correctness/useExhaustiveDependencies: stable join strings are intentional stable dep keys
	useEffect(() => {
		setSaved(new Set(initialSaved));
		setMatters(new Set(initialMatters));
	}, [initialSaved.join(","), initialMatters.join(",")]);

	async function record(item: Item, action: "save" | "matters") {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;

		if (action === "save") {
			setSaved((prev) => new Set([...prev, item.id]));
		} else {
			setMatters((prev) => new Set([...prev, item.id]));
		}

		await supabase.from("content_interactions").insert({
			user_id: user.id,
			content_item_id: item.id,
			action,
			content_category_id: item.content_category_id,
			kind: item.kind,
		});
	}

	if (items.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center">
				<p className="text-sm text-white/40">
					No content yet. Check back soon.
				</p>
			</div>
		);
	}

	return (
		<div
			className="h-full snap-y snap-mandatory overflow-y-scroll"
			style={{ scrollbarWidth: "none" }}
		>
			{items.map((item) => {
				const ytEmbed = item.external_url
					? youtubeEmbedUrl(item.external_url)
					: null;
				const isVideo = item.kind === "video";

				return (
					<div
						key={item.id}
						className="relative flex h-svh snap-start snap-always flex-col overflow-hidden"
						style={{ minHeight: "100svh" }}
					>
						{/* Background */}
						{isVideo ? (
							<VideoBackground item={item} />
						) : (
							<div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#111]" />
						)}

						{/* Top chrome */}
						<div className="relative flex items-center justify-between px-5 pt-14 pb-4">
							<span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 font-medium text-[11px] text-white/70">
								{KIND_LABELS[item.kind] ?? item.kind}
							</span>
							{item.eyebrow && (
								<span className="text-[11px] text-white/40">
									{item.eyebrow}
								</span>
							)}
						</div>

						{/* YouTube embed (full-height when video) */}
						{isVideo && ytEmbed && (
							<div className="relative flex-1 px-4 pb-4">
								<iframe
									src={ytEmbed}
									className="h-full w-full rounded-2xl"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
									title={item.title}
								/>
							</div>
						)}

						{/* Text content */}
						<div
							className={`relative flex flex-col px-5 pb-6 ${isVideo && ytEmbed ? "pt-2" : "flex-1 justify-end"}`}
						>
							<h2 className="mb-3 font-semibold text-[26px] text-white leading-[1.22] tracking-[-0.01em]">
								{item.title}
							</h2>
							{item.body && !ytEmbed && (
								<p className="mb-5 text-[15px] text-white/60 leading-relaxed">
									{item.body}
								</p>
							)}
							<div className="flex items-center gap-3">
								{item.source && (
									<span className="text-[13px] text-white/50">
										{item.source}
									</span>
								)}
								{item.external_url && !isVideo && (
									<a
										href={item.external_url}
										target="_blank"
										rel="noopener noreferrer"
										className="font-semibold text-[13px] text-white"
									>
										Open →
									</a>
								)}
							</div>
						</div>

						{/* Action rail */}
						<div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
							<ActionButton
								active={matters.has(item.id)}
								onClick={() => record(item, "matters")}
								label="Matters"
							>
								<StarIcon active={matters.has(item.id)} />
							</ActionButton>
							<ActionButton
								active={saved.has(item.id)}
								onClick={() => record(item, "save")}
								label="Save"
							>
								<BookmarkIcon active={saved.has(item.id)} />
							</ActionButton>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function ActionButton({
	active,
	onClick,
	label,
	children,
}: {
	active: boolean;
	onClick: () => void;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex flex-col items-center gap-1.5"
		>
			<div
				className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
					active ? "border-white/40 bg-white/15" : "border-white/12 bg-white/6"
				}`}
			>
				{children}
			</div>
			<span
				className={`font-medium text-[10px] ${active ? "text-white" : "text-white/40"}`}
			>
				{label}
			</span>
		</button>
	);
}

function StarIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="19"
			height="19"
			viewBox="0 0 24 24"
			fill={active ? "white" : "none"}
			stroke="white"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
		</svg>
	);
}

function BookmarkIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="19"
			height="19"
			viewBox="0 0 24 24"
			fill={active ? "white" : "none"}
			stroke="white"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
		</svg>
	);
}
