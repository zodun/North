export type FeedItem = {
	id: string;
	kind: "essay" | "voice" | "story" | "opportunity" | "video";
	title: string;
	eyebrow: string | null;
	body: string | null;
	source: string | null;
	attribution_text: string | null;
	external_url: string | null;
	cloudinary_public_id: string | null;
	thumbnail_url: string | null;
	content_category_id: string | null;
	published_at: string;
	sort_order: number;
	/** Set for community posts only — the auth user who posted the video. */
	creator_id?: string | null;
	creator_name?: string | null;
};

/** A followable person behind a feed slide (community poster / mock creator). */
export type Creator = {
	id: string;
	name: string;
	tagline: string | null;
};

/** One comment on a feed item (from feed_comments, or in-memory under bypass). */
export type FeedComment = {
	id: string;
	item_id: string;
	author: string;
	body: string;
	created_at: string;
	isMine: boolean;
};

// The For You pager renders a mixed deck: full-bleed videos interleaved with
// full-bleed editorial slides, all on the one sanctioned dark surface.
export type FeedSlide =
	| { type: "video"; id: string; item: FeedItem; creator: Creator | null }
	| {
			type: "signal";
			id: string;
			quote: string;
			attribution: string | null;
			dateLabel: string;
	  }
	| {
			type: "opportunity";
			id: string;
			title: string;
			org: string | null;
			deadline: string | null;
			url: string | null;
	  }
	| {
			type: "story";
			id: string;
			title: string;
			excerpt: string;
			author: string | null;
	  }
	| {
			type: "article";
			id: string;
			title: string;
			excerpt: string | null;
			source: string | null;
			url: string | null;
	  }
	| { type: "discussion"; id: string; quote: string; author: string }
	| {
			type: "digest";
			id: string;
			weekLabel: string;
			newOpportunities: number;
			topStory: string | null;
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
