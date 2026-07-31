---
name: North
description: Direction over attention — a calm, airy "Soft Sky" daily-direction app for young professionals.
colors:
  sky: "#F3F5F7" # app base (cool, airy light)
  sky-raised: "#F9FAFB" # insets / muted surface
  surface: "#FFFFFF" # cards
  signal-gold: "#F0B429" # accent fill (next action)
  gold-deep: "#DE911D"
  gold-ink: "#8A6400" # gold as text/icon on light (≥4.5:1)
  direction-teal: "#16A085" # accent fill (on-course)
  teal-ink: "#0E7A66" # teal as text/icon on light
  drift-violet: "#6C5CE7" # accent fill (drift)
  violet-ink: "#5546C8" # violet as text on light
  signal-green: "#27AE60"
  green-ink: "#15803D"
  noise-red: "#EB5757"
  red-ink: "#DC2626"
  ink: "#0D1321" # primary text (Night — also the dark ground + app icon tile)
  muted: "#0D13219E" # ~62% — secondary text (≥4.5:1)
  hairline: "#0D13211A" # ~10% — borders
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Geist, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 6vw, 3rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.14em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "24px"
components:
  pill-active:
    backgroundColor: "{colors.signal-gold}"
    textColor: "#05050E" # dark ink on the gold fill
    rounded: "{rounded.full}"
    padding: "4px 12px"
  pill-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  button-cta:
    backgroundColor: "#3ECFBF24"
    textColor: "{colors.teal-ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "16px"
  card-small:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "13px 14px"
  chip:
    backgroundColor: "{colors.sky-raised}"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: North

## 1. Overview

**Creative North Star: "Soft Sky"**

North is a calm, airy light field — daylight, not darkness — where a single gold
needle always points somewhere. Where mainstream consumer apps engineer a
hyperstimulating surface to capture attention, North engineers a clear, restful one
to give direction. The screen sits on a cool light sky (`#F3F5F7`) with white cards,
and color is still rationed to three meanings: **gold is the needle** (the goal, the
active pill, the thing to do next), **teal is on-course** (signal, progress, the
journal CTA), **violet is drift** (the low end of the Signal band). Because the
surface is light, those vivid hues carry meaning as *fills*; as text or icons they
use their readable ink variants (`gold-ink`, `teal-ink`, `violet-ink`) to hold
≥4.5:1 contrast. Nothing glows for its own sake. A user should feel oriented, not
stimulated.

This system explicitly rejects the **generic AI-app skin** — purple-gradient-on-glass,
blur-everywhere, the interchangeable 2025/26 wrapper look — and the **muddy AI-cream
default** light palette (sand/beige/parchment near-whites). North's light is a clean,
cool sky, not warm paper. It also refuses the **attention-optimized social feed** it
competes with (no autoplay shimmer, no dopamine reds, no infinite-scroll density),
**gamified-hustle pressure** (neon streak-guilt), and **cold corporate-SaaS
dashboards** (KPI-card grids). Momentum is quiet; honesty is the feature.

Density is low and deliberate. Cards are flat white, separated by hairline borders
rather than shadow. Type does the shouting — Plus Jakarta Sans at
black weight for a score or a goal — while the rest stays composed.

**Key Characteristics:**
- Near-black cinematic ground; color rationed to three meanings (gold/teal/violet).
- Flat surfaces, hairline borders, translucent-white fills — depth without shadow.
- Display type carries hierarchy; muted body stays calm.
- Mobile-first PWA, tuned for mid-range Android on variable networks.

## 2. Colors

A rationed three-meaning palette on a near-black ground; every accent means something.

### Primary
- **Signal Gold** (`#F0B429`): the needle. The active goal, the selected cadence
  pill, the "do this next" accent, the goal-card gradient and 3px left rail. The
  deeper **Gold Deep** (`#DE911D`) appears in older Signal surfaces; treat `#F0B429`
  as canonical going forward.

### Secondary
- **Direction Teal** (`#16A085`): on-course. Progress fills, the current-week marker,
  completed task checks, the journal "Find the signal" CTA, signal-positive accents.

### Tertiary
- **Drift Violet** (`#6C5CE7`): the low end of the Signal band (Drifting). Used
  structurally in the 7-segment direction bar, not as a decorative accent.
- **Signal Green** (`#27AE60`) and **Noise Red** (`#EB5757`): the honest pair — what
  energized you vs. what pulled you away. Reserved for Signal/Noise semantics only.

### Neutral
- **Night** (`#05050E`): the page ground for product surfaces. **Night Raised**
  (`#0A0A0F`) is the app-shell ground; **Surface** (`#111118`) is the raised sheet.
- **Ink** (`#F0F0F5`): primary text and the big display numerals.
- **Muted** (`#F0F0F58C`, ink at 55%): secondary text. For labels, ink steps down to
  ~30–40% — still ≥4.5:1 against night for body sizes; verify when going lighter.
- **Hairline** (`#FFFFFF14`, white at 8%): the default border. Surfaces are filled
  with white at 3–7% rather than a solid card color.

### Named Rules
**The Three-Meaning Rule.** Gold = the needle (next action / goal). Teal = on-course
(progress / signal). Violet = drift. A color used outside its meaning is a bug. No
fourth accent earns the surface.

## 3. Typography

**Display Font:** Plus Jakarta Sans (with Geist, system-ui fallback)
**Body Font:** Geist (with system-ui fallback)
**Label/Mono Font:** Geist Mono (where mono is needed)

**Character:** One humanist-geometric sans (Plus Jakarta) carries the brand, paired
on a **weight contrast axis** — black/extrabold for display, regular for body —
rather than two competing families. Geist is the quiet system body. Hierarchy is
weight and size, never decoration.

### Hierarchy
- **Display** (800, `clamp(1.375rem, 6vw, 3rem)`, lh 1, tracking -0.02em): the
  Direction Score numeral (48px), the "Mission" title, big goal numbers.
- **Headline** (700, 1.25rem, lh 1.2): section titles inside the Signal surface.
- **Title** (700, 0.9375rem, lh 1.35): goal statement, card titles.
- **Body** (400, 0.8125rem, lh 1.5): descriptions, journal prose, observation text.
  Cap measure at 65–75ch.
- **Label** (700, 0.5625rem, uppercase, tracking 0.14em): section eyebrows
  ("4-Week Plan", "Direction Score · This Week"), badge text.

### Named Rules
**The Weight-Not-Family Rule.** Contrast comes from weight (black vs. regular) and
size, never from pairing two similar sans. Never set body in Plus Jakarta black or a
display number in Geist regular.

## 4. Elevation

North is **flat by doctrine**. There are no drop shadows on cards. Depth is built
from translucency: the near-black ground shows through white fills at 3–7%, and
hairline borders (`#FFFFFF14`) draw the edges. A "raised" element is lighter and
better-bordered, not shadowed. The only glow-like treatments are intentional and
rare — a gold left-rail on the goal card, a colored border on the current item.

### Named Rules
**The No-Shadow Rule.** Surfaces never cast shadow. If something needs to feel
raised, raise its fill opacity (3% → 7%) and tighten its border, never add a
`box-shadow`. Shadow reads as 2014-era app; translucency reads as cinematic.

## 5. Components

### Buttons
- **Shape:** fully rounded pills for toggles (`9999px`); 10px radius for block CTAs.
- **Cadence pill (primary):** active = Signal Gold fill on Night ink, bold 10px;
  inactive = transparent, 1px hairline, muted text. The active pill is the needle.
- **Block CTA (teal):** teal at 10% fill, teal at 25% border, teal text, 10px radius
  (`Find the signal`). Hover lifts the fill to 15%.
- **Hover / Focus:** color/opacity transitions only, 200ms, `motion-reduce`
  alternative. No transform jumps.

### Chips
- **Style:** white at 5–8% fill, hairline border, fully rounded, muted text, 9px
  bold uppercase for status badges (In progress / Done / Upcoming) tinted teal / gold
  / muted respectively.

### Cards / Containers
- **Corner Style:** large surfaces 18px (`rounded-xl`), small/list cards 14px,
  inner stat tiles 12px.
- **Background:** white at 3–7% over Night; the goal card adds a gold gradient
  (`linear-gradient(135deg, rgba(240,180,41,0.10), rgba(240,180,41,0.03))`) + a 3px
  gold left rail (the one allowed left-accent — it's a rail, not a stripe-border).
- **Shadow Strategy:** none. See Elevation.
- **Internal Padding:** 16px large, 13–14px small.

### Inputs / Fields
- **Style:** white at 5% fill, `#FFFFFF17` border, 10px radius, ink text, muted
  placeholder at ≥22% (verify ≥4.5:1).
- **Focus:** border shifts to Direction Teal; no glow ring, no layout shift.

### Navigation
- **Style:** fixed bottom tab bar on near-black with hairline top border and
  backdrop blur; four tabs around a center gold action button. Active tab is ink,
  inactive is muted; labels are 10px.

### Direction Score (signature)
The Signal card: a 48px black numeral on a teal-tinted surface, a gold band pill,
and a **7-segment band bar** (violet · violet · teal · teal · gold · gold · cap)
lit to the score's position — Drifting → Finding → Aligned. Three flat stat tiles
below (Active days / Tasks done / In focus). This is the honest mirror, rendered
calm.

## 6. Do's and Don'ts

### Do:
- **Do** keep color rationed to three meanings: gold = next action, teal = on-course,
  violet = drift. Verify any new accent against the Three-Meaning Rule.
- **Do** build depth with translucent white fills (3–7%) and hairline borders
  (`#FFFFFF14`), never shadow.
- **Do** carry hierarchy with weight — Plus Jakarta black for display, Geist regular
  for body.
- **Do** ship a `prefers-reduced-motion` alternative for every transition; keep
  micro-interactions 150–300ms, color/opacity only.
- **Do** keep body text ≥4.5:1 on Night; bump muted toward ink when it's close.

### Don't:
- **Don't** reach for the **generic AI-app skin** — purple gradients, glassmorphism,
  blur-everywhere. Glass is rare and purposeful or nothing.
- **Don't** make North feel like an **attention-optimized social feed**: no autoplay
  shimmer, dopamine reds, or infinite-scroll density.
- **Don't** add **gamified-hustle** neon streak-guilt or **corporate-SaaS** KPI-card
  grids; they strip the calm out of Signal and Profile.
- **Don't** use `box-shadow` on cards (No-Shadow Rule) or a `border-left`/`border-right`
  greater than 1px as a colored stripe. The goal card's 3px rail is the single
  sanctioned exception and it is a full-height rail, not a list-item accent.
- **Don't** set a fourth accent color, gradient text, or a tiny tracked uppercase
  eyebrow on every section. One labelled eyebrow per surface, with intent.
