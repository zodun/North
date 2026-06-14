"use client";

import { Button } from "@north/ui/components/button";
import { Input } from "@north/ui/components/input";
import { Label } from "@north/ui/components/label";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { type AddLinkOutInput, addLinkOut } from "../_actions/add-link-out";

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

type Fields = Pick<
	AddLinkOutInput,
	"kind" | "title" | "contentCategoryId" | "externalUrl" | "attributionText"
>;

const BLANK: Fields = {
	kind: "essay",
	title: "",
	contentCategoryId: "purpose",
	externalUrl: "",
	attributionText: "",
};

export function AddLinkOutForm() {
	const [open, setOpen] = useState(false);
	const [fields, setFields] = useState<Fields>(BLANK);
	const [pending, startTransition] = useTransition();

	function set<K extends keyof Fields>(k: K, v: Fields[K]) {
		setFields((prev) => ({ ...prev, [k]: v }));
	}

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (
			!fields.title.trim() ||
			!fields.externalUrl.trim() ||
			!fields.attributionText.trim()
		) {
			toast.error("Title, URL, and attribution are all required.");
			return;
		}
		startTransition(async () => {
			const res = await addLinkOut(fields);
			if ("error" in res && res.error) {
				toast.error(res.error);
			} else {
				toast.success("Added as draft. Set it to Cleared to make it live.");
				setFields(BLANK);
				setOpen(false);
			}
		});
	}

	if (!open) {
		return (
			<Button variant="outline" onClick={() => setOpen(true)}>
				Add link-out item
			</Button>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="mt-4 max-w-lg space-y-4 rounded-lg border p-4"
		>
			<h3 className="font-medium text-sm">New link-out content item</h3>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1">
					<Label htmlFor="lof-kind">Kind</Label>
					<select
						id="lof-kind"
						value={fields.kind}
						onChange={(e) => set("kind", e.target.value as Fields["kind"])}
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
					<Label htmlFor="lof-cat">Category</Label>
					<select
						id="lof-cat"
						value={fields.contentCategoryId}
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
				<Label htmlFor="lof-title">Title</Label>
				<Input
					id="lof-title"
					value={fields.title}
					onChange={(e) => set("title", e.target.value)}
					placeholder="Article or resource title"
					required
				/>
			</div>

			<div className="space-y-1">
				<Label htmlFor="lof-url">External URL</Label>
				<Input
					id="lof-url"
					type="url"
					value={fields.externalUrl}
					onChange={(e) => set("externalUrl", e.target.value)}
					placeholder="https://..."
					required
				/>
			</div>

			<div className="space-y-1">
				<Label htmlFor="lof-attr">Attribution</Label>
				<Input
					id="lof-attr"
					value={fields.attributionText}
					onChange={(e) => set("attributionText", e.target.value)}
					placeholder="Author / Publisher, Year"
					required
				/>
			</div>

			<div className="flex gap-2">
				<Button type="submit" disabled={pending}>
					{pending ? "Adding..." : "Add as draft"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						setFields(BLANK);
						setOpen(false);
					}}
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}
