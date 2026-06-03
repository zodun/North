export type FeedItem = {
	id: string;
	kind: "essay" | "voice" | "story" | "opportunity";
	title: string;
	eyebrow: string | null;
	body: string | null;
	source: string | null;
	attribution_text: string | null;
	external_url: string | null;
	cloudinary_public_id: string | null;
	content_category_id: string | null;
	published_at: string;
	sort_order: number;
};

// Matches the action check constraint in 0001_init.sql.
export type FeedAction =
	| "view"
	| "save"
	| "matters"
	| "pass"
	| "finish"
	| "share"
	| "long_dwell";
