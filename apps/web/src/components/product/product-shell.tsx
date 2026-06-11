"use client";

import { useState } from "react";
import { VideoUploadSheet } from "@/app/(product)/(tabs)/for-you/video-upload-sheet";
import { TabBar } from "./tab-bar";

export function ProductShell({ children }: { children: React.ReactNode }) {
	const [showUpload, setShowUpload] = useState(false);

	return (
		<div className="relative flex h-svh flex-col overflow-hidden bg-[#0a0a0a] text-white">
			<main className="flex-1 overflow-y-auto pb-20">{children}</main>
			<TabBar onUpload={() => setShowUpload(true)} />
			{showUpload && (
				<VideoUploadSheet
					onClose={() => setShowUpload(false)}
					onPosted={() => setShowUpload(false)}
				/>
			)}
		</div>
	);
}
