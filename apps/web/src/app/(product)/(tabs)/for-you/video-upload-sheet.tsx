"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/auth-client";

type Props = { onClose: () => void; onPosted: () => void };

function getSupportedMimeType(): string {
	const types = [
		"video/webm;codecs=vp9,opus",
		"video/webm;codecs=vp8,opus",
		"video/webm",
		"video/mp4",
	];
	return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
}

function formatTime(s: number): string {
	const m = Math.floor(s / 60)
		.toString()
		.padStart(2, "0");
	const sec = (s % 60).toString().padStart(2, "0");
	return `${m}:${sec}`;
}

export function VideoUploadSheet({ onClose, onPosted }: Props) {
	const fileRef = useRef<HTMLInputElement>(null);
	const videoPreviewRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const [file, setFile] = useState<File | null>(null);
	const [caption, setCaption] = useState("");
	const [uploading, setUploading] = useState(false);
	const [posted, setPosted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showCamera, setShowCamera] = useState(false);
	const [recording, setRecording] = useState(false);
	const [recordSeconds, setRecordSeconds] = useState(0);
	const [cameraError, setCameraError] = useState<string | null>(null);

	// Attach stream to video element once camera view mounts
	useEffect(() => {
		if (!showCamera) return;
		const video = videoPreviewRef.current;
		const stream = streamRef.current;
		if (video && stream) {
			video.srcObject = stream;
			video.play().catch(() => {});
		}
	}, [showCamera]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopCamera();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function stopCamera() {
		if (timerRef.current) clearInterval(timerRef.current);
		if (mediaRecorderRef.current?.state === "recording") {
			mediaRecorderRef.current.stop();
		}
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) track.stop();
			streamRef.current = null;
		}
		setShowCamera(false);
		setRecording(false);
		setRecordSeconds(0);
	}

	async function openCamera() {
		setCameraError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "environment",
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
				audio: true,
			});
			streamRef.current = stream;
			setShowCamera(true);
		} catch (err) {
			setCameraError(
				err instanceof Error ? err.message : "Camera access denied.",
			);
		}
	}

	function startRecording() {
		if (!streamRef.current) return;
		chunksRef.current = [];
		const mimeType = getSupportedMimeType();
		const mr = new MediaRecorder(streamRef.current, { mimeType });
		mr.ondataavailable = (e) => {
			if (e.data.size > 0) chunksRef.current.push(e.data);
		};
		mr.onstop = () => {
			const blob = new Blob(chunksRef.current, { type: mimeType });
			const ext = mimeType.includes("webm") ? "webm" : "mp4";
			setFile(new File([blob], `recording.${ext}`, { type: mimeType }));
			stopCamera();
		};
		mr.start(100);
		mediaRecorderRef.current = mr;
		setRecording(true);
		setRecordSeconds(0);
		timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
	}

	function stopRecording() {
		if (timerRef.current) clearInterval(timerRef.current);
		mediaRecorderRef.current?.stop();
		setRecording(false);
	}

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
		// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: backdrop dismiss, keyboard users can press Escape or use the close button
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
			onClick={showCamera ? undefined : onClose}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: inner sheet stops backdrop click propagating */}
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
						{showCamera
							? recording
								? "Recording…"
								: "Camera"
							: "Share a video"}
					</h2>
					<button
						type="button"
						onClick={showCamera ? stopCamera : onClose}
						className="cursor-pointer text-white/40 hover:text-white"
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

				{/* ── Posted ── */}
				{posted ? (
					<div className="flex flex-col items-center justify-center gap-3 py-12">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5C842]/15">
							<svg
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#F5C842"
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
				) : showCamera ? (
					/* ── Camera view ── */
					<div className="flex flex-col p-4">
						{/* Live preview */}
						<div className="relative overflow-hidden rounded-2xl bg-black">
							<video
								ref={videoPreviewRef}
								muted
								playsInline
								autoPlay
								className="aspect-video w-full object-cover"
							/>
							{/* Recording indicator */}
							{recording && (
								<div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 backdrop-blur-sm">
									<span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
									<span className="font-bold text-[12px] text-white">
										{formatTime(recordSeconds)}
									</span>
								</div>
							)}
						</div>

						{/* Controls */}
						<div className="mt-4 flex items-center justify-center gap-5">
							{!recording ? (
								<>
									<button
										type="button"
										onClick={stopCamera}
										className="cursor-pointer rounded-full border border-white/15 bg-white/8 px-5 py-2.5 font-medium text-[13px] text-white/60 transition-colors hover:bg-white/15"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={startRecording}
										className="flex cursor-pointer items-center gap-2 rounded-full bg-red-500 px-6 py-3 font-bold text-[14px] text-white shadow-[0_4px_16px_rgba(239,68,68,0.5)] transition-transform active:scale-95"
									>
										<span className="h-2.5 w-2.5 rounded-full bg-white" />
										Record
									</button>
								</>
							) : (
								<button
									type="button"
									onClick={stopRecording}
									className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-red-500 bg-black/40 px-6 py-3 font-bold text-[14px] text-red-400 transition-transform active:scale-95"
								>
									<span className="h-3 w-3 rounded-sm bg-red-500" />
									Stop
								</button>
							)}
						</div>
					</div>
				) : (
					/* ── Upload form ── */
					<form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
						{/* Hidden library picker */}
						<input
							ref={fileRef}
							type="file"
							accept="video/mp4,video/quicktime,video/webm"
							className="hidden"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
						/>

						{file ? (
							/* File selected */
							<div className="flex items-center gap-3 rounded-xl border border-[#F5C842]/40 bg-[#F5C842]/8 p-3.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F5C842]/15">
									<svg
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#F5C842"
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
									className="cursor-pointer text-white/30 hover:text-white/60"
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
							/* Source picker */
							<div className="flex gap-3">
								{/* Camera */}
								<button
									type="button"
									onClick={openCamera}
									className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-[#F5C842]/25 bg-[#F5C842]/8 py-7 transition-colors hover:bg-[#F5C842]/14"
								>
									<svg
										width="26"
										height="26"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#F5C842"
										strokeWidth={1.6}
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="M23 7l-7 5 7 5V7z" />
										<rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
										<circle cx="8" cy="12" r="2" fill="#F5C842" stroke="none" />
									</svg>
									<span className="font-bold text-[#F5C842] text-[12px]">
										Record
									</span>
								</button>

								{/* Library */}
								<button
									type="button"
									onClick={() => fileRef.current?.click()}
									className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 py-7 transition-colors hover:bg-white/7"
								>
									<svg
										width="26"
										height="26"
										viewBox="0 0 24 24"
										fill="none"
										stroke="rgba(255,255,255,0.45)"
										strokeWidth={1.6}
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<rect x="2" y="5" width="20" height="14" rx="2" />
										<path d="M8 5V3M16 5V3" />
										<path d="M2 10h20" />
									</svg>
									<span className="font-medium text-[12px] text-white/45">
										Library
									</span>
								</button>
							</div>
						)}

						{cameraError && (
							<p className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
								{cameraError}
							</p>
						)}

						{/* Caption */}
						{file && (
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
						)}

						{error && <p className="text-[12px] text-red-400">{error}</p>}

						{file && (
							<button
								type="submit"
								disabled={uploading}
								className="flex h-13 cursor-pointer items-center justify-center rounded-xl bg-[#F5C842] font-bold text-[#1a1400] text-[15px] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
							>
								{uploading ? "Uploading…" : "Post"}
							</button>
						)}
					</form>
				)}
			</div>
		</div>
	);
}
