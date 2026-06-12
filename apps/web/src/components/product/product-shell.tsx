"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { VideoUploadSheet } from "@/app/(product)/(tabs)/for-you/video-upload-sheet";
import { TabBar } from "./tab-bar";

// Pre-login / onboarding screens aren't part of the 5-tab loop, so the bottom
// tab bar shouldn't appear there.
const NO_TABS = /^\/(sign-in|sign-up|onboarding)(\/|$)/;

export function ProductShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const hideTabs = NO_TABS.test(pathname);
	const [showUpload, setShowUpload] = useState(false);

	return (
		<div className="relative flex h-svh flex-col overflow-hidden bg-[#0a0a0a] text-white">
			<main className={`flex-1 overflow-y-auto ${hideTabs ? "" : "pb-20"}`}>
				{children}
			</main>
			{!hideTabs && <TabBar onUpload={() => setShowUpload(true)} />}
			{showUpload && (
				<VideoUploadSheet
					onClose={() => setShowUpload(false)}
					onPosted={() => setShowUpload(false)}
				/>
			)}
		</div>
	);
}
