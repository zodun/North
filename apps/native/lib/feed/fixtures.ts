// Mock fixtures for the For You feed under the dev auth bypass.
//
// Everything here is in-memory only: like counts, comments, and follows live
// in module-level stores that survive re-mounts within a JS session, so the
// social actions feel real during design review without touching Supabase.
//
// Video URLs reuse the same free sample files the seeded demo data points at
// (0054_fix_demo_video_urls.sql) so playback works in the native player.

import type { Creator, FeedComment, FeedItem, FeedSlide } from "./types";

// ── Creators ─────────────────────────────────────────────────────────────

const CREATORS: Record<string, Creator> = {
	renee: {
		id: "mock-creator-renee",
		name: "Renée Chin",
		tagline: "Career coach · Kingston",
	},
	marcus: {
		id: "mock-creator-marcus",
		name: "Marcus Grant",
		tagline: "HEART/NSTA instructor",
	},
	alia: {
		id: "mock-creator-alia",
		name: "Alia Thompson",
		tagline: "Product designer · UWI Mona grad",
	},
	dwayne: {
		id: "mock-creator-dwayne",
		name: "Dwayne Salmon",
		tagline: "Analyst at NCB",
	},
};

// ── Videos ───────────────────────────────────────────────────────────────

type MockVideo = {
	id: string;
	title: string;
	url: string;
	thumb: string;
	creator: Creator;
};

const VIDEOS: MockVideo[] = [
	{
		id: "mock-video-1",
		title: "Three things I wish I knew before my NCB internship interview",
		url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
		thumb:
			"https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=720&q=80",
		creator: CREATORS.dwayne,
	},
	{
		id: "mock-video-2",
		title: "How I used HEART's free web dev course to land remote work",
		url: "https://media.w3.org/2010/05/bunny/movie.mp4",
		thumb:
			"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=720&q=80",
		creator: CREATORS.marcus,
	},
	{
		id: "mock-video-3",
		title: "CXC results don't define you. Here's what actually mattered for me",
		url: "https://media.w3.org/2010/05/bunny/trailer.mp4",
		thumb:
			"https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=720&q=80",
		creator: CREATORS.renee,
	},
	{
		id: "mock-video-4",
		title: "A day in the life: junior product designer in Kingston",
		url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
		thumb:
			"https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=720&q=80",
		creator: CREATORS.alia,
	},
	{
		id: "mock-video-5",
		title: "How I budgeted my first UWI semester — real numbers, no fluff",
		url: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
		thumb:
			"https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=720&q=80",
		creator: CREATORS.renee,
	},
];

// ── Signal of the day (rotates by day of year) ───────────────────────────

const SIGNAL_QUOTES: { quote: string; attribution: string }[] = [
	{
		quote:
			"Direction beats speed. A slow walk north gets you further than a sprint in circles.",
		attribution: "North",
	},
	{
		quote:
			"You don't need to feel ready. You need one small step you can actually take today.",
		attribution: "North",
	},
	{
		quote:
			"Comparison is noise. The only track that matters is the one between where you were and where you're going.",
		attribution: "North",
	},
	{
		quote:
			"Opportunity rarely announces itself. It looks like a deadline three weeks out and an unwritten application.",
		attribution: "North",
	},
	{
		quote:
			"Consistency is a quiet skill. Nobody claps for day 12 — but day 12 is where it turns.",
		attribution: "North",
	},
];

function dayOfYear(d: Date): number {
	const start = Date.UTC(d.getFullYear(), 0, 1);
	return Math.floor((d.getTime() - start) / 86_400_000);
}

export function mockSignalSlide(now = new Date()): FeedSlide {
	const pick = SIGNAL_QUOTES[dayOfYear(now) % SIGNAL_QUOTES.length];
	return {
		type: "signal",
		id: "mock-signal",
		quote: pick.quote,
		attribution: pick.attribution,
		dateLabel: now
			.toLocaleDateString("en-US", { month: "short", day: "numeric" })
			.toUpperCase(),
	};
}

// ── The mock deck ────────────────────────────────────────────────────────

function videoSlide(v: MockVideo): FeedSlide {
	const item: FeedItem = {
		id: v.id,
		kind: "video",
		title: v.title,
		eyebrow: "COMMUNITY",
		body: null,
		source: null,
		attribution_text: null,
		external_url: v.url,
		cloudinary_public_id: null,
		thumbnail_url: v.thumb,
		content_category_id: null,
		published_at: new Date().toISOString(),
		sort_order: 0,
		creator_id: v.creator.id,
		creator_name: v.creator.name,
	};
	return { type: "video", id: v.id, item, creator: v.creator };
}

export function buildMockDeck(now = new Date()): FeedSlide[] {
	const weekLabel = `Week of ${new Date(now.getTime() - now.getDay() * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
	return [
		mockSignalSlide(now),
		videoSlide(VIDEOS[0]),
		{
			type: "opportunity",
			id: "mock-opp-1",
			title: "NCB Foundation Scholarship 2026",
			org: "NCB Foundation",
			deadline: "Closes Aug 29",
			url: "https://www.jncb.com/foundation",
		},
		videoSlide(VIDEOS[1]),
		{
			type: "story",
			id: "mock-story-1",
			title: "From Spanish Town to software engineer",
			excerpt:
				"Kemar failed math twice at CSEC. Then a free HEART course, a borrowed laptop, and 18 months of showing up every evening changed everything. He now builds payment systems for a Kingston fintech.",
			author: "Kemar Reid",
		},
		videoSlide(VIDEOS[2]),
		{
			type: "article",
			id: "mock-article-1",
			title: "The scholarship essay mistake almost everyone makes",
			excerpt:
				"Committees read hundreds of essays about passion. The ones that win talk about evidence — what you did when nobody was watching.",
			source: "North Editorial",
			url: "https://example.com/scholarship-essay-mistake",
		},
		videoSlide(VIDEOS[3]),
		{
			type: "discussion",
			id: "mock-discussion-1",
			quote:
				"Anybody else applying for Chevening this year? Looking for an accountability partner for the essays — deadline is creeping up.",
			author: "Shanice W.",
		},
		videoSlide(VIDEOS[4]),
		{
			type: "opportunity",
			id: "mock-opp-2",
			title: "Digital Skills Bootcamp — free, 12 weeks",
			org: "HEART/NSTA Trust",
			deadline: "Closes Sep 12",
			url: "https://www.heart-nsta.org",
		},
		{
			type: "digest",
			id: "mock-digest",
			weekLabel,
			newOpportunities: 14,
			topStory: "From Spanish Town to software engineer",
		},
	];
}

// ── In-memory social stores (bypass mode) ────────────────────────────────

const BASE_LIKES: Record<string, number> = {
	"mock-signal": 212,
	"mock-video-1": 148,
	"mock-video-2": 96,
	"mock-video-3": 421,
	"mock-video-4": 63,
	"mock-video-5": 187,
	"mock-opp-1": 74,
	"mock-opp-2": 51,
	"mock-story-1": 259,
	"mock-article-1": 88,
	"mock-discussion-1": 35,
};

const SEED_COMMENTS: Record<string, { author: string; body: string }[]> = {
	"mock-video-1": [
		{
			author: "Tavia",
			body: "The part about following up after the interview — gold. Nobody tells you this.",
		},
		{ author: "Jordan", body: "Saving this for my little brother, thank you!" },
		{
			author: "Kimani",
			body: "Had my NCB interview last month and can confirm every word of this.",
		},
	],
	"mock-video-2": [
		{
			author: "Ricardo",
			body: "Which HEART centre did you do it at? Portmore or downtown?",
		},
		{
			author: "Amoy",
			body: "Started the same course last week. This is motivation.",
		},
	],
	"mock-video-3": [
		{
			author: "Shanice",
			body: "Needed to hear this today. Results came out and I was spiralling.",
		},
		{ author: "Dre", body: "Respect for being real about it." },
	],
	"mock-story-1": [
		{
			author: "Malik",
			body: "Spanish Town stand up! This could be me next year.",
		},
		{
			author: "Toni-Ann",
			body: "18 months of evenings. That's the part people skip over.",
		},
	],
	"mock-discussion-1": [
		{
			author: "Peta-Gaye",
			body: "Yes! Second time applying — happy to swap essay drafts.",
		},
	],
};

export type MockSocialStores = {
	likeCounts: Map<string, number>;
	likedByMe: Set<string>;
	comments: Map<string, FeedComment[]>;
	follows: Set<string>;
};

export const mockStores: MockSocialStores = {
	likeCounts: new Map<string, number>(),
	likedByMe: new Set<string>(),
	comments: new Map<string, FeedComment[]>(),
	follows: new Set<string>(),
};

export function mockLikeCount(id: string): number {
	if (!mockStores.likeCounts.has(id)) {
		mockStores.likeCounts.set(id, BASE_LIKES[id] ?? 0);
	}
	return mockStores.likeCounts.get(id) as number;
}

/** Lazily seed 2-3 believable comments for a mock item the first time it's read. */
export function mockCommentsFor(id: string): FeedComment[] {
	if (!mockStores.comments.has(id)) {
		const seeds = SEED_COMMENTS[id] ?? [];
		const now = Date.now();
		mockStores.comments.set(
			id,
			seeds.map((c, i) => ({
				id: `${id}-seed-${i}`,
				item_id: id,
				author: c.author,
				body: c.body,
				created_at: new Date(now - (i + 2) * 3_600_000 * 5).toISOString(),
				isMine: false,
			})),
		);
	}
	return mockStores.comments.get(id) as FeedComment[];
}
