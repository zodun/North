// Article-image cascade — resolves a cover for an article that carries no real
// image (no og:image, no YouTube thumb). Designed as a pluggable seam so the
// paid generation engine drops in later without touching callers.
//
//   Tier A  AI cover (gated)        — a TEXT-TO-IMAGE provider renders an
//                                     on-brand cover; Cloudinary is the sink
//                                     (upload + CDN + transforms). NB: Cloudinary
//                                     itself has no from-scratch text-to-image —
//                                     all its generative transforms need a source
//                                     image — so the model must be external
//                                     (gpt-image-1 / Imagen / Flux). Gated off.
//   Tier B  Deterministic cover     — zero-cost procedural Soft Sky art. Always
//                                     succeeds, so the cascade never returns null.
//
// Resolution happens ONCE at ingestion / in the nightly cron (never at render,
// never per-user) and the winning URL is written to content_items.thumbnail_url,
// so the existing feed + /api/img proxy render it with no further work.

import { type CoverInput, coverUrl } from "./cover";

export type ArticleImageInput = {
	id: string;
	title: string;
	category?: string | null;
	body?: string | null;
	url?: string | null;
};

export type ArticleImageResult = {
	// Same-origin or absolute URL to store in thumbnail_url.
	url: string;
	// Set when an asset was generated + uploaded to the Cloudinary sink.
	publicId?: string | null;
	// Provenance, for diagnostics / cost accounting.
	source: "ai-generated" | "deterministic";
};

// A generation engine. Returns null when it cannot (or should not) produce an
// image — the cascade then falls to the next tier. Engines MUST be side-effect
// free beyond their own asset creation and MUST be safe to call concurrently.
export interface ArticleImageGenerator {
	readonly name: ArticleImageResult["source"];
	// Whether this engine is configured + permitted to run right now.
	isEnabled(): boolean;
	generate(input: ArticleImageInput): Promise<ArticleImageResult | null>;
}

// ── Tier B: deterministic cover (free, always available) ─────────────────────
export const deterministicGenerator: ArticleImageGenerator = {
	name: "deterministic",
	isEnabled: () => true,
	async generate(input) {
		const cover: CoverInput = { id: input.id, category: input.category };
		return { url: coverUrl(cover), source: "deterministic" };
	},
};

// ── Tier A: AI cover via external text-to-image + Cloudinary sink (gated stub)─
// Enabled only when the flag is on AND a text-to-image provider key is present
// AND Cloudinary (the sink) is configured — so the free tier ships today and the
// paid engine is a config flip plus the TODO below.
// Implementation plan (kept out of the hot path on purpose):
//   1. Claude distils {title, body, category} into an ABSTRACT visual concept
//      prompt (Soft Sky palette, no text, no faces, no real scenes).
//   2. An external text-to-image model (gpt-image-1 / Imagen / Flux) renders it —
//      Cloudinary has no from-scratch text-to-image, so generation lives here.
//   3. Upload the result to Cloudinary (CDN + transforms); capture public_id.
//   4. Claude vision QAs on-brand + safe; reject → return null (fall to Tier B).
export const aiCoverGenerator: ArticleImageGenerator = {
	name: "ai-generated",
	isEnabled() {
		return (
			process.env.ARTICLE_IMAGE_GEN === "1" &&
			Boolean(process.env.IMAGE_GEN_API_KEY) &&
			Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
			Boolean(process.env.CLOUDINARY_API_KEY) &&
			Boolean(process.env.CLOUDINARY_API_SECRET)
		);
	},
	async generate(_input) {
		// TODO(article-image): Claude concept prompt → text-to-image model →
		// Cloudinary upload → Claude vision QA. Until then the cascade falls to the
		// deterministic tier, so no card is ever image-less.
		return null;
	},
};

// Ordered best-first. New engines slot in ahead of deterministic.
const ENGINES: ArticleImageGenerator[] = [
	aiCoverGenerator,
	deterministicGenerator,
];

export type ResolveOpts = {
	// Remaining paid-generation budget for this run. When 0, only free engines
	// run. The caller decrements it on every paid success.
	budget?: { remaining: number };
};

// Resolve a cover, walking the cascade until an engine produces one. The
// deterministic tier guarantees a non-null result.
export async function resolveArticleImage(
	input: ArticleImageInput,
	opts: ResolveOpts = {},
): Promise<ArticleImageResult> {
	for (const engine of ENGINES) {
		if (!engine.isEnabled()) continue;
		const paid = engine.name !== "deterministic";
		if (paid && opts.budget && opts.budget.remaining <= 0) continue;
		try {
			const result = await engine.generate(input);
			if (result) {
				if (paid && opts.budget) opts.budget.remaining -= 1;
				return result;
			}
		} catch {
			// Engine failure must never break the cascade — fall through.
		}
	}
	// deterministic always returns, so this is the guaranteed floor.
	const floor = await deterministicGenerator.generate(input);
	if (floor) return floor;
	throw new Error("article-image: no engine produced a cover");
}
