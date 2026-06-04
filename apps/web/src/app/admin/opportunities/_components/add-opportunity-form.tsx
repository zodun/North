"use client";

import { Button } from "@north/ui/components/button";
import { Input } from "@north/ui/components/input";
import { Label } from "@north/ui/components/label";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import {
	type UpsertOpportunityInput,
	upsertOpportunity,
} from "../_actions/upsert-opportunity";

const OPP_CATEGORIES = [
	{ id: "job", label: "Jobs" },
	{ id: "internship", label: "Internships" },
	{ id: "scholarship", label: "Scholarships" },
	{ id: "accelerator", label: "Accelerators" },
	{ id: "grant", label: "Grants" },
	{ id: "community", label: "Communities" },
	{ id: "event", label: "Events" },
	{ id: "creator-programme", label: "Creator Programmes" },
] as const;

type Fields = Pick<
	UpsertOpportunityInput,
	| "title"
	| "org"
	| "categoryId"
	| "opportunityType"
	| "location"
	| "deadline"
	| "why"
	| "externalUrl"
	| "attributionText"
>;

const BLANK: Fields = {
	title: "",
	org: "",
	categoryId: "job",
	opportunityType: "",
	location: "",
	deadline: "",
	why: "",
	externalUrl: "",
	attributionText: "",
};

export function AddOpportunityForm() {
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
			!fields.org.trim() ||
			!fields.externalUrl.trim() ||
			!fields.attributionText.trim()
		) {
			toast.error("Title, org, URL, and attribution are all required.");
			return;
		}
		startTransition(async () => {
			const res = await upsertOpportunity({
				...fields,
				title: fields.title.trim(),
				org: fields.org.trim(),
				externalUrl: fields.externalUrl.trim(),
				attributionText: fields.attributionText.trim(),
				opportunityType: fields.opportunityType?.trim() || undefined,
				location: fields.location?.trim() || undefined,
				deadline: fields.deadline?.trim() || undefined,
				why: fields.why?.trim() || undefined,
			});
			if ("error" in res && res.error) {
				toast.error(res.error);
			} else {
				toast.success("Added as draft — clear it to make it live.");
				setFields(BLANK);
				setOpen(false);
			}
		});
	}

	if (!open) {
		return (
			<Button variant="outline" onClick={() => setOpen(true)}>
				Add opportunity
			</Button>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="mt-4 max-w-lg space-y-4 rounded-lg border p-4"
		>
			<h3 className="font-medium text-sm">New opportunity</h3>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1">
					<Label htmlFor="opp-cat">Category</Label>
					<select
						id="opp-cat"
						value={fields.categoryId}
						onChange={(e) => set("categoryId", e.target.value)}
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
					>
						{OPP_CATEGORIES.map((c) => (
							<option key={c.id} value={c.id}>
								{c.label}
							</option>
						))}
					</select>
				</div>

				<div className="space-y-1">
					<Label htmlFor="opp-type">Type (free text, optional)</Label>
					<Input
						id="opp-type"
						value={fields.opportunityType}
						onChange={(e) => set("opportunityType", e.target.value)}
						placeholder="e.g. Full-time, 6-month, remote"
					/>
				</div>
			</div>

			<div className="space-y-1">
				<Label htmlFor="opp-title">Title</Label>
				<Input
					id="opp-title"
					value={fields.title}
					onChange={(e) => set("title", e.target.value)}
					placeholder="Software Engineer — Caribbean Remote"
					required
				/>
			</div>

			<div className="space-y-1">
				<Label htmlFor="opp-org">Organisation</Label>
				<Input
					id="opp-org"
					value={fields.org}
					onChange={(e) => set("org", e.target.value)}
					placeholder="Company or institution"
					required
				/>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-1">
					<Label htmlFor="opp-loc">Location</Label>
					<Input
						id="opp-loc"
						value={fields.location}
						onChange={(e) => set("location", e.target.value)}
						placeholder="Kingston, JM / Remote"
					/>
				</div>

				<div className="space-y-1">
					<Label htmlFor="opp-deadline">Deadline</Label>
					<Input
						id="opp-deadline"
						value={fields.deadline}
						onChange={(e) => set("deadline", e.target.value)}
						placeholder="30 June 2026"
					/>
				</div>
			</div>

			<div className="space-y-1">
				<Label htmlFor="opp-why">Why it's relevant (optional)</Label>
				<Input
					id="opp-why"
					value={fields.why}
					onChange={(e) => set("why", e.target.value)}
					placeholder="One line for the user — why this matters"
				/>
			</div>

			<div className="space-y-1">
				<Label htmlFor="opp-url">External URL</Label>
				<Input
					id="opp-url"
					type="url"
					value={fields.externalUrl}
					onChange={(e) => set("externalUrl", e.target.value)}
					placeholder="https://..."
					required
				/>
			</div>

			<div className="space-y-1">
				<Label htmlFor="opp-attr">Source / attribution</Label>
				<Input
					id="opp-attr"
					value={fields.attributionText}
					onChange={(e) => set("attributionText", e.target.value)}
					placeholder="e.g. careers.jn.com, 2026"
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
