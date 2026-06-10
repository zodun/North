"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/auth-client";

type Props = { onClose: () => void; onPosted: () => void };

export function VideoUploadSheet({ onClose, onPosted }: Props) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [caption, setCaption] = useState("");
	const [uploading, setUploading] = useState(false);
	const [posted, setPosted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!file) return;
		setError(null);
		setUploading(true);

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			setError("Not signed in.");
			setUploading(false);
			return;
		}

		const ext = file.name.split(".").pop() ?? "mp4";
		const path = `${user.id}/${Date.now()}.${ext}`;

		const { error: storageErr } = await supabase.storage
			.from("community-videos")
			.upload(path, file, { contentType: file.type, upsert: false });

		if (storageErr) {
			setError(storageErr.message);
			setUploading(false);
			return;
		}

		const videoUrl = supabase.storage
			.from("community-videos")
			.getPublicUrl(path).data.publicUrl;

		const { error: postErr } = await supabase.from("community_posts").insert({
			user_id: user.id,
			post_type: "mission_progress",
			caption: caption || null,
			video_url: videoUrl,
		});

		setUploading(false);
		if (postErr) {
			setError(postErr.message);
			return;
		}

		setPosted(true);
		setTimeout(() => {
			onClose();
			onPosted();
		}, 1400);
	}

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: backdrop dismiss — keyboard users can press Escape or use the close button
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: inner sheet stops backdrop click from propagating */}
			<div
				className="w-full max-w-lg rounded-t-3xl bg-[#131313] pb-safe"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Handle */}
				<div className="flex justify-center pt-3 pb-1">
					<div className="h-1 w-9 rounded-full bg-white/20" />
				</div>

				<div className="flex items-center justify-between border-white/8 border-b px-5 py-3">
					<h2 className="font-semibold text-[16px] text-white">
						Share a video
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-white/40 hover:text-white"
						aria-label="Close"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>

				{posted ? (
					<div className="flex flex-col items-center justify-center gap-3 py-12">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e9c349]/15">
							<svg
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#e9c349"
								strokeWidth={2.5}
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M20 6L9 17l-5-5" />
							</svg>
						</div>
						<p className="font-semibold text-[18px] text-white">Posted!</p>
						<p className="text-[13px] text-white/40">
							Your video is now in the feed.
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
						{/* File picker */}
						<input
							ref={fileRef}
							type="file"
							accept="video/mp4,video/quicktime,video/webm"
							className="hidden"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						/>
						{file ? (
							<div className="flex items-center gap-3 rounded-xl border border-[#e9c349]/40 bg-[#e9c349]/8 p-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#e9c349]/15">
									<svg
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#e9c349"
										strokeWidth={1.8}
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="M23 7l-7 5 7 5V7z" />
										<rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
									</svg>
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-[13px] text-white">
										Video ready
									</p>
									<p className="truncate text-[11px] text-white/40">
										{file.name}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setFile(null)}
									className="text-white/30 hover:text-white/60"
									aria-label="Remove"
								>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth={2}
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="M18 6L6 18M6 6l12 12" />
									</svg>
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => fileRef.current?.click()}
								className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 py-8 transition-colors hover:bg-white/6"
							>
								<svg
									width="28"
									height="28"
									viewBox="0 0 24 24"
									fill="none"
									stroke="rgba(255,255,255,0.4)"
									strokeWidth={1.6}
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M23 7l-7 5 7 5V7z" />
									<rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
								</svg>
								<span className="font-medium text-[13px] text-white/50">
									Choose video
								</span>
								<span className="text-[11px] text-white/25">
									MP4, MOV, WebM · max 100 MB
								</span>
							</button>
						)}

						{/* Caption */}
						<div>
							<p className="mb-1.5 font-semibold text-[11px] text-white/35 uppercase tracking-widest">
								Caption (optional)
							</p>
							<textarea
								value={caption}
								onChange={(e) => setCaption(e.target.value)}
								placeholder="Tell people what's in your video…"
								maxLength={280}
								rows={3}
								className="w-full resize-none rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
							/>
							<p className="mt-1 text-right text-[11px] text-white/25">
								{caption.length}/280
							</p>
						</div>

						{error && <p className="text-[12px] text-red-400">{error}</p>}

						<button
							type="submit"
							disabled={!file || uploading}
							className="flex h-13 items-center justify-center rounded-xl bg-[#e9c349] font-bold text-[#1a1400] text-[15px] transition-opacity disabled:opacity-40"
						>
							{uploading ? "Uploading…" : "Post"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
