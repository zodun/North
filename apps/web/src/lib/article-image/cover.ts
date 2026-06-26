// Deterministic, on-brand cover art for articles that carry no real image.
//
// This is the zero-cost "free tier" of the article-image cascade (see ./index):
// pure procedural SVG, no AI call, no storage, instant, and identical every time
// for a given article id. It honours the Soft Sky system (calm light field, a
// gold needle that points somewhere, category-rationed accent) so an image-less
// card reads as a *designed* backdrop, never generic AI filler.
//
// Used two ways:
//   • coverUrl(), build the same-origin /api/cover URL (client-safe; the
//                         feed points an image-less card's <img> at it).
//   • renderCoverSvg(), render the SVG bytes server-side (the /api/cover route).

// ── Category palette (mirrors the feed's CAT_STYLES) ─────────────────────────
type Palette = { accent: string; from: string; mid: string; to: string };
// Each palette runs from a saturated accent tint at the TOP (where the compass
// lives and the card image actually shows) down to the cool Soft Sky base
// (#EDF1F8) at the bottom (washed by the card's text gradient). This keeps the
// art unmistakably *coloured* and intentional — never a muddy near-white box —
// while still sitting inside North's calm light field.
const PALETTES: Record<string, Palette> = {
	career: { accent: "#F5C842", from: "#F3CF63", mid: "#F8E29C", to: "#EDF1F8" },
	mindset: {
		accent: "#7B61FF",
		from: "#B7A4FF",
		mid: "#DBCEFF",
		to: "#EDF1F8",
	},
	money: { accent: "#3ECFBF", from: "#6FE0D2", mid: "#BCF1EB", to: "#EDF1F8" },
	skills: { accent: "#D4522A", from: "#F0926E", mid: "#F9C7B4", to: "#EDF1F8" },
	health: { accent: "#2E9E5B", from: "#74C994", mid: "#BDE9CD", to: "#EDF1F8" },
};
const GOLD = "#F5C842";

// Map a free-text category/eyebrow to a palette key (same buckets as the feed).
export function coverCatKey(label: string | null | undefined): string {
	const l = (label ?? "").toLowerCase();
	if (/(mind|mental|wellbeing|purpose)/.test(l)) return "mindset";
	if (/(money|financ|wealth|invest)/.test(l)) return "money";
	if (/(skill|learn|craft|study)/.test(l)) return "skills";
	if (/(health|fitness|body|wellness)/.test(l)) return "health";
	if (/(mindset)/.test(l)) return "mindset";
	return "career";
}

// Stable string → 32-bit hash (same family as the feed's hashId).
function hash(s: string): number {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}
// Deterministic PRNG seeded by the hash, successive calls vary one cover's
// composition without ever depending on Math.random (so the art is reproducible).
function mulberry(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export type CoverInput = {
	id: string;
	category?: string | null;
};

// Same-origin URL the feed can drop straight into an <img src>. Relative on
// purpose: proxiedImage() passes it through untouched and it stays same-origin.
export function coverUrl(input: CoverInput): string {
	const cat = coverCatKey(input.category);
	const seed = (hash(input.id) % 100000).toString();
	return `/api/cover?cat=${cat}&seed=${seed}`;
}

// Render a deterministic Soft Sky cover. Portrait, full-bleed (object-cover).
export function renderCoverSvg(catRaw: string, seedRaw: string): string {
	const cat = PALETTES[catRaw] ? catRaw : coverCatKey(catRaw);
	const p = PALETTES[cat] ?? PALETTES.career;
	const rnd = mulberry(hash(`${cat}:${seedRaw}`));
	const W = 1080;
	const H = 1920;

	// Compass hub lives in the UPPER third, that's the part of a feed card the
	// image actually shows (the text gradient washes the lower half to the card
	// colour). Needle points along a seeded angle; it always points somewhere.
	const cx = W * (0.3 + rnd() * 0.4);
	const cy = H * (0.24 + rnd() * 0.14);
	const angle = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.2;
	const needleLen = H * (0.16 + rnd() * 0.07);
	const nx = cx + Math.cos(angle) * needleLen;
	const ny = cy + Math.sin(angle) * needleLen;
	// Tail (short, opposite side) so the needle reads as a compass, not a stick.
	const tx = cx - Math.cos(angle) * needleLen * 0.32;
	const ty = cy - Math.sin(angle) * needleLen * 0.32;

	// Topographic rings, concentric, accent stroke, opacity ramping outward.
	// Bolder than a hairline: thicker stroke + a higher starting opacity so the
	// compass reads as deliberate cartography, not a faint watermark.
	const ringCount = 7 + Math.floor(rnd() * 4);
	const ringStep = Math.min(W, H) * 0.072 + rnd() * 26;
	let rings = "";
	for (let i = 1; i <= ringCount; i++) {
		const r = i * ringStep;
		const op = Math.max(0.08, 0.5 - i * 0.045).toFixed(3);
		rings += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(
			1,
		)}" fill="none" stroke="${p.accent}" stroke-width="4" stroke-opacity="${op}"/>`;
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="North cover art">
  <defs>
    <linearGradient id="bg" x1="0.15" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${p.from}"/>
      <stop offset="0.42" stop-color="${p.mid}"/>
      <stop offset="1" stop-color="${p.to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.1" r="0.85">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/>
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="accentGlow" cx="${(cx / W).toFixed(3)}" cy="${(cy / H).toFixed(3)}" r="0.62">
      <stop offset="0" stop-color="${p.accent}" stop-opacity="0.42"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#accentGlow)"/>
  <g>${rings}</g>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g stroke-linecap="round">
    <line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${p.accent}" stroke-width="20" stroke-opacity="0.28"/>
    <line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${GOLD}" stroke-width="13" stroke-opacity="1"/>
    <circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="24" fill="${GOLD}"/>
    <circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="24" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.55"/>
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="15" fill="#FFFFFF" stroke="${p.accent}" stroke-width="6" stroke-opacity="0.9"/>
  </g>
</svg>`;
}
