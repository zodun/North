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
