// Composes the For You pager deck: videos interleaved with editorial slides
// (signal of the day, opportunity highlights, success stories, articles, a
// trending discussion, and a closing weekly digest).
//
// Bypass mode serves the fixture deck; real mode maps whatever kinds the feed
// returns into slides and simply skips types with no data.

import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { buildMockDeck } from "./fixtures";
import type { Creator, FeedItem, FeedSlide } from "./types";
import { useFeed } from "./use-feed";

// Caps keep the pager a deck, not a dump — the feed can return 60+ essays.
const MAX_OPPORTUNITIES = 3;
const MAX_STORIES = 3;
const MAX_ARTICLES = 4;

function dayOfYear(d: Date): number {
	const start = Date.UTC(d.getFullYear(), 0, 1);
	return Math.floor((d.getTime() - start) / 86_400_000);
}

/** First sentence-ish excerpt, hard-capped so display type stays big and calm. */
function excerptOf(body: string, max: number): string {
	const clean = body.replace(/\s+/g, " ").trim();
	if (clean.length <= max) return clean;
	const cut = clean.slice(0, max);
	const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
	if (stop > max * 0.5) return cut.slice(0, stop + 1);
	return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function creatorOf(item: FeedItem): Creator | null {
	if (!item.creator_id) return null;
	return {
		id: item.creator_id,
		name: item.creator_name ?? "Community member",
		tagline: null,
	};
}

type Discussion = { id: string; quote: string; author: string };

function composeSlides(
	items: FeedItem[],
	discussion: Discussion | null,
	now = new Date(),
): FeedSlide[] {
	const videos = items.filter(
		(i) =>
			i.kind === "video" &&
			!!i.external_url &&
			!i.external_url.includes("youtube"),
	);

	// Signal of the day: a real quote from curated content, rotated daily.
	const quotable = items.filter(
		(i) =>
			(i.kind === "essay" || i.kind === "voice" || i.kind === "story") &&
			!!i.body &&
			i.body.length > 60,
	);
	let signal: FeedSlide | null = null;
	if (quotable.length > 0) {
		const pick = quotable[dayOfYear(now) % quotable.length];
		signal = {
			type: "signal",
			id: pick.id,
			quote: excerptOf(pick.body as string, 180),
			attribution: pick.source ?? pick.attribution_text ?? null,
			dateLabel: now
				.toLocaleDateString("en-US", { month: "short", day: "numeric" })
				.toUpperCase(),
		};
	}
	const signalId = signal?.id ?? null;

	const opportunities: FeedSlide[] = items
		.filter((i) => i.kind === "opportunity" && i.id !== signalId)
		.slice(0, MAX_OPPORTUNITIES)
		.map((i) => ({
			type: "opportunity",
			id: i.id,
			title: i.title,
			org: i.source ?? i.attribution_text,
			deadline: null, // content_items carries no deadline column
			url: i.external_url,
		}));

	const stories: FeedSlide[] = items
		.filter((i) => i.kind === "story" && !!i.body && i.id !== signalId)
		.slice(0, MAX_STORIES)
		.map((i) => ({
			type: "story",
			id: i.id,
			title: i.title,
			excerpt: excerptOf(i.body as string, 240),
			author: i.attribution_text ?? i.source,
		}));

	const articles: FeedSlide[] = items
		.filter((i) => i.kind === "essay" && i.id !== signalId)
		.slice(0, MAX_ARTICLES)
		.map((i) => ({
			type: "article",
			id: i.id,
			title: i.title,
			excerpt: i.body ? excerptOf(i.body, 160) : null,
			source: i.source,
			url: i.external_url,
		}));

	// Round-robin the editorial queues so no two alike land back to back.
	const queues = [opportunities, stories, articles];
	const extras: FeedSlide[] = [];
	let drained = false;
	for (let round = 0; !drained; round++) {
		drained = true;
		for (const q of queues) {
			if (round < q.length) {
				extras.push(q[round]);
				drained = false;
			}
		}
	}
	if (discussion) {
		extras.splice(Math.min(2, extras.length), 0, {
			type: "discussion",
			id: discussion.id,
			quote: discussion.quote,
			author: discussion.author,
		});
	}

	const deck: FeedSlide[] = [];
	if (signal) deck.push(signal);
	let e = 0;
	for (let i = 0; i < videos.length; i++) {
		const v = videos[i];
		deck.push({ type: "video", id: v.id, item: v, creator: creatorOf(v) });
		if ((i + 1) % 2 === 0 && e < extras.length) deck.push(extras[e++]);
	}
	while (e < extras.length) deck.push(extras[e++]);

	if (deck.length > 0) {
		const allOpportunities = items.filter((i) => i.kind === "opportunity");
		const weekStart = new Date(now.getTime() - now.getDay() * 86_400_000);
		deck.push({
			type: "digest",
			id: "digest",
			weekLabel: `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
			newOpportunities: allOpportunities.length,
			topStory:
				(stories[0]?.type === "story" ? stories[0].title : null) ??
				(articles[0]?.type === "article" ? articles[0].title : null),
		});
	}

	return deck;
}

export function useForYouFeed() {
	const bypass = useAuthBypass();
	const { items, loading, error, refresh } = useFeed(null);
	const [discussion, setDiscussion] = useState<Discussion | null>(null);

	// Trending discussion: most recent captioned community post. Best-effort —
	// any failure (missing table, RLS) just means the slide is skipped.
	useEffect(() => {
		if (bypass) return;
		let cancelled = false;
		(async () => {
			try {
				const { data, error: err } = await supabase
					.from("community_posts")
					.select("id, user_id, caption, created_at")
					.not("caption", "is", null)
					.order("created_at", { ascending: false })
					.limit(1);
				if (err || cancelled || !data || data.length === 0) return;
				const post = data[0] as {
					id: string;
					user_id: string;
					caption: string | null;
				};
				if (!post.caption) return;
				let author = "A community member";
				const { data: profiles } = await supabase
					.from("profiles")
					.select("display_name")
					.eq("user_id", post.user_id)
					.limit(1);
				const name = (
					profiles as { display_name: string | null }[] | null
				)?.[0]?.display_name?.trim();
				if (name) author = name;
				if (!cancelled) {
					setDiscussion({ id: post.id, quote: post.caption, author });
				}
			} catch {
				// skip the slide
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [bypass]);

	const slides = useMemo(
		() => (bypass ? buildMockDeck() : composeSlides(items, discussion)),
		[bypass, items, discussion],
	);

	// The underlying FeedItems (for the interactions/context wrapper).
	const feedItems = useMemo(
		() =>
			slides.flatMap((s) => (s.type === "video" ? [s.item] : [])) as FeedItem[],
		[slides],
	);

	const doRefresh = useCallback(async () => {
		if (bypass) return;
		await refresh();
	}, [bypass, refresh]);

	return {
		slides,
		feedItems,
		loading: bypass ? false : loading,
		error: bypass ? null : error,
		refresh: doRefresh,
	};
}
