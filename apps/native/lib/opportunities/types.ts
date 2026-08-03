export type Opportunity = {
	id: string;
	title: string;
	org: string;
	category_id: string | null;
	opportunity_type: string | null;
	location: string | null;
	deadline: string | null;
	why: string | null;
	external_url: string | null;
	published_at: string;
};

export type SavedState = {
	saved: boolean;
	applied: boolean;
};

// ── Application tracker (OPP roadmap: Application tracker) ───────────

export type ApplicationStatus =
	| "saved"
	| "applied"
	| "interview"
	| "offer"
	| "closed";

export const STATUS_ORDER: ApplicationStatus[] = [
	"saved",
	"applied",
	"interview",
	"offer",
	"closed",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
	saved: "Saved",
	applied: "Applied",
	interview: "Interview",
	offer: "Offer",
	closed: "Closed",
};

/** Next stage on the pipeline, or null when the item is terminal. */
export function nextStatus(
	status: ApplicationStatus,
): ApplicationStatus | null {
	switch (status) {
		case "saved":
			return "applied";
		case "applied":
			return "interview";
		case "interview":
			return "offer";
		default:
			return null;
	}
}

export type TrackedApplication = {
	opportunity: Opportunity;
	status: ApplicationStatus;
	reminderId: string | null;
};
