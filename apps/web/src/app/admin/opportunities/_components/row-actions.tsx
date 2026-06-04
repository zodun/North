"use client";

import { Button } from "@north/ui/components/button";
import { useTransition } from "react";
import { toast } from "sonner";

import { clearOpportunity } from "../_actions/clear-opportunity";

type Props = {
	id: string;
	status: string;
	canClear: boolean; // external_url + attribution_text are both set
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
					? "Add attribution and an external URL before clearing"
					: "Publish now"
			}
			onClick={() => {
				startTransition(async () => {
					const res = await clearOpportunity(id);
					if ("error" in res && res.error) {
						toast.error(res.error);
					} else {
						toast.success("Cleared — opportunity is now live.");
					}
				});
			}}
		>
			{pending ? "Clearing…" : "Clear"}
		</Button>
	);
}
