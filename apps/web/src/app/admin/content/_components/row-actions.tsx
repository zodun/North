"use client";

import { Button } from "@north/ui/components/button";
import { useTransition } from "react";
import { toast } from "sonner";

import { clearContent } from "../_actions/clear-content";

type Props = {
	id: string;
	status: string;
	// attribution_text is not null AND (external_url or cloudinary_public_id) is set
	canClear: boolean;
};

export function RowActions({ id, status, canClear }: Props) {
	const [pending, startTransition] = useTransition();

	if (status === "cleared") {
		return <span className="text-muted-foreground text-xs">Live</span>;
	}

	if (status === "blocked") {
		return <span className="text-destructive text-xs">Blocked</span>;
	}

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={!canClear || pending}
			title={
				!canClear
					? "Add attribution and a URL/media before clearing"
					: "Promote to cleared and publish now"
			}
			onClick={() => {
				startTransition(async () => {
					const res = await clearContent(id);
					if ("error" in res && res.error) {
						toast.error(res.error);
					} else {
						toast.success("Cleared. Item is now live in the feed.");
					}
				});
			}}
		>
			{pending ? "Clearing…" : "Clear"}
		</Button>
	);
}
