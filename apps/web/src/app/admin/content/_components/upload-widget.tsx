"use client";

import { Button } from "@north/ui/components/button";
import { Input } from "@north/ui/components/input";
import { Label } from "@north/ui/components/label";
import { CldUploadWidget } from "next-cloudinary";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { upsertContent } from "../_actions/upsert-content";

const CATEGORIES = [
	{ id: "purpose", label: "Purpose" },
	{ id: "careers", label: "Careers" },
	{ id: "entrepreneurship", label: "Entrepreneurship" },
	{ id: "remote-work", label: "Remote work" },
	{ id: "ai", label: "AI" },
	{ id: "caribbean-success", label: "Caribbean success" },
	{ id: "self-development", label: "Self development" },
	{ id: "opportunities", label: "Opportunities" },
	{ id: "productivity", label: "Productivity" },
	{ id: "mental-clarity", label: "Mental clarity" },
] as const;

const KINDS = [
	{ id: "essay", label: "Essay" },
	{ id: "voice", label: "Voice / video" },
	{ id: "story", label: "Story" },
	{ id: "opportunity", label: "Opportunity" },
] as const;

type Meta = {
	kind: (typeof KINDS)[number]["id"];
	title: string;
	contentCategoryId: string;
	attributionText: string;
};

const BLANK: Meta = {
	kind: "essay",
	title: "",
	contentCategoryId: "purpose",
	attributionText: "",
};

type Props = { cloudName: string };

export function ContentUploadWidget({ cloudName }: Props) {
	const [open, setOpen] = useState(false);
	const [meta, setMeta] = useState<Meta>(BLANK);
	const [pending, startTransition] = useTransition();

	function set<K extends keyof Meta>(k: K, v: Meta[K]) {
		setMeta((m) => ({ ...m, [k]: v }));
	}

	function canUpload() {
		return (
			meta.title.trim().length > 0 && meta.attributionText.trim().length > 0
		);
	}

	if (!open) {
		return (
			<Button variant="outline" onClick={() => setOpen(true)}>
				Upload hosted media
			</Button>
		);
	}

	return (
		<div className="mt-4 max-w-lg space-y-4 rounded-lg border p-4">
			<h3 className="font-medium text-sm">Upload hosted media to Cloudinary</h3>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1">
					<Label htmlFor="uw-kind">Kind</Label>
					<select
						id="uw-kind"
						value={meta.kind}
						onChange={(e) => set("kind", e.target.value as Meta["kind"])}
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
					>
						{KINDS.map((k) => (
							<option key={k.id} value={k.id}>
								{k.label}
							</option>
						))}
					</select>
				</div>

				<div className="space-y-1">
					<Label htmlFor="uw-cat">Category</Label>
					<select
						id="uw-cat"
						value={meta.contentCategoryId}
						onChange={(e) => set("contentCategoryId", e.target.value)}
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
					>
						{CATEGORIES.map((c) => (
							<option key={c.id} value={c.id}>
								{c.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="space-y-1">
				<Label htmlFor="uw-title">Title</Label>
				<Input
					id="uw-title"
					value={meta.title}
					onChange={(e) => set("title", e.target.value)}
					placeholder="Article or resource title"
				/>
			</div>

			<div className="space-y-1">
				<Label htmlFor="uw-attr">Attribution</Label>
				<Input
					id="uw-attr"
					value={meta.attributionText}
					onChange={(e) => set("attributionText", e.target.value)}
					placeholder="Author / Publisher, Year"
				/>
			</div>

			<div className="flex gap-2">
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
						if (
							!result.info ||
							typeof result.info === "string" ||
							!("public_id" in result.info)
						)
							return;
						const publicId = (result.info as { public_id: string }).public_id;
						startTransition(async () => {
							const res = await upsertContent({
								kind: meta.kind,
								title: meta.title,
								contentCategoryId: meta.contentCategoryId,
								attributionText: meta.attributionText,
								cloudinaryPublicId: publicId,
							});
							if ("error" in res && res.error) {
								toast.error(`Upload saved but DB row failed: ${res.error}`);
							} else {
								toast.success("Uploaded as draft — review below, then clear.");
								setMeta(BLANK);
								setOpen(false);
							}
						});
					}}
				>
					{({ open: openWidget }) => (
						<Button
							type="button"
							onClick={() => openWidget?.()}
							disabled={!canUpload() || pending}
							title={
								!canUpload() ? "Fill in title and attribution first" : undefined
							}
						>
							{pending ? "Saving..." : "Choose file & upload"}
						</Button>
					)}
				</CldUploadWidget>

				<Button
					type="button"
					variant="outline"
					onClick={() => {
						setMeta(BLANK);
						setOpen(false);
					}}
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
