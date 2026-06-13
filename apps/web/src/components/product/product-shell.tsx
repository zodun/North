"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { VideoUploadSheet } from "@/app/(product)/(tabs)/for-you/video-upload-sheet";
import { TabBar } from "./tab-bar";

// Pre-login / onboarding screens aren't part of the 5-tab loop, so the bottom
// tab bar shouldn't appear there.
const NO_TABS = /^\/(sign-in|sign-up|onboarding)(\/|$)/;
// For You and Community render their own profile entry point in-header, so the
// shell's fallback top-right avatar is suppressed there to avoid duplication.
const HAS_OWN_PROFILE_LINK = /^\/(for-you|community)(\/|$)/;
const IS_FOR_YOU = /^\/for-you(\/|$)/;

export function ProductShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const hideTabs = NO_TABS.test(pathname);
	const onForYou = IS_FOR_YOU.test(pathname);
	const [showUpload, setShowUpload] = useState(false);

	return (
		<div className="relative flex h-svh flex-col overflow-hidden bg-[#EDF1F8] text-[#0E1420]">
			{/* Soft Sky atmosphere — an airy light field, the daytime counterpart
			    to the Night Compass. A clean white lift up top, a faint teal
			    breath bottom-right and a whisper of gold top-left carry the
			    brand's meanings without muddying the light. Fixed, so it stays
			    put while content scrolls over it. */}
			<div
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 z-0"
				style={{
					background:
						"radial-gradient(150% 85% at 50% -12%, rgba(255,255,255,0.95), transparent 60%)," +
						"radial-gradient(120% 90% at 100% 102%, rgba(62,207,191,0.10), transparent 55%)," +
						"radial-gradient(110% 70% at 2% -4%, rgba(245,200,66,0.08), transparent 50%)",
				}}
			/>

			{/* Profile moved off the tab bar — keep it reachable via a fixed
			    top-right avatar on tab pages that don't provide their own. */}
			{!hideTabs && !HAS_OWN_PROFILE_LINK.test(pathname) && (
				<a
					href="/profile"
					aria-label="Your profile"
					className="fixed top-[12px] right-[14px] z-30 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border bg-white/90 backdrop-blur-sm"
					style={{ borderColor: "rgba(26,18,8,0.08)" }}
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="rgba(26,18,8,0.55)"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="8" r="4" />
						<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
					</svg>
					<span className="sr-only">Your profile</span>
				</a>
			)}

			<main
				className={`relative z-10 flex-1 overflow-y-auto ${hideTabs ? "" : "pb-20"}`}
			>
				{children}
			</main>

			{/* Video upload kept reachable now that the centre tab button is gone:
			    a floating action on the For You feed opens the same sheet. */}
			{onForYou && (
				<button
					type="button"
					onClick={() => setShowUpload(true)}
					aria-label="Post a video"
					className="fixed right-[16px] bottom-[84px] z-30 flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full active:scale-95"
					style={{
						background: "linear-gradient(135deg, #C47D00, #A36200)",
						boxShadow: "0 6px 20px rgba(196,125,0,0.4)",
					}}
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#FFFFFF"
						strokeWidth={2.4}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M12 5v14M5 12h14" />
					</svg>
				</button>
			)}

			{!hideTabs && <TabBar />}
			{showUpload && (
				<VideoUploadSheet
					onClose={() => setShowUpload(false)}
					onPosted={() => setShowUpload(false)}
				/>
			)}
		</div>
	);
}
