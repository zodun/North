"use client";

// Cloudinary Upload Widget for admin content (DEC-20).
// Wraps next-cloudinary's CldUploadWidget; on success, calls the
// `signatureEndpoint` (/api/cloudinary/sign) for a per-upload sig.
// On upload completion, invokes the upsertContent server action so
// the row appears in admin/content with license_status='draft'.

import { Button } from "@north/ui/components/button";
import { CldUploadWidget } from "next-cloudinary";
import { useState } from "react";
import { toast } from "sonner";

import { upsertContent } from "../_actions/upsert-content";

type Props = {
	cloudName: string;
	defaultKind?: "essay" | "voice" | "story" | "opportunity";
	defaultTitle?: string;
};

export function ContentUploadWidget({
	cloudName,
	defaultKind = "essay",
	defaultTitle = "Untitled",
}: Props) {
	const [busy, setBusy] = useState(false);
	return (
		<CldUploadWidget
			signatureEndpoint="/api/cloudinary/sign"
			options={{
				cloudName,
				sources: ["local", "url"],
				multiple: false,
				resourceType: "auto",
				folder: "north/content",
				maxFileSize: 25 * 1024 * 1024,
			}}
			onSuccess={async (result) => {
				if (busy) return;
				if (
					!result.info ||
					typeof result.info === "string" ||
					!("public_id" in result.info)
				)
					return;
				const publicId = (result.info as { public_id: string }).public_id;
				setBusy(true);
				const res = await upsertContent({
					kind: defaultKind,
					title: defaultTitle,
					cloudinaryPublicId: publicId,
				});
				setBusy(false);
				if ("error" in res && res.error) {
					toast.error(`Upload saved but DB row failed: ${res.error}`);
				} else {
					toast.success("Uploaded — review in the table below, then clear.");
				}
			}}
		>
			{({ open }) => (
				<Button
					type="button"
					onClick={() => open?.()}
					disabled={busy}
					variant="outline"
				>
					{busy ? "Saving..." : "Upload to Cloudinary"}
				</Button>
			)}
		</CldUploadWidget>
	);
}
