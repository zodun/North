# north

The stack is fixed by DEC-06 in [`docs/north-operating-document.md`](./docs/north-operating-document.md):

- **Product surface:** Expo + React Native (`apps/native`)
- **Admin surface:** Next.js (`apps/web`) — content curation (FR-FEED-04) and opportunity upload (DEC-03)
- **Backend & data:** Supabase (PostgreSQL + Auth + Row-Level Security + Edge Functions)
- **Client SDK:** `supabase-js` only (no ORM in the client)
- **AI:** OpenAI, called only from Edge Functions
- **Media:** Cloudinary · **Analytics:** PostHog · **Push:** FCM · Payments deferred
- **Tooling:** TypeScript, TailwindCSS, shadcn/ui (`packages/ui`), Biome, Turborepo

## Getting started

```bash
bun install
supabase start          # local Postgres + Studio; requires Docker
supabase db reset       # apply migrations in supabase/migrations
cp apps/web/.env.example apps/web/.env
cp apps/native/.env.example apps/native/.env
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY (from `supabase status`), and the EXPO_PUBLIC_* equivalents.
bun run dev             # all apps
```

Web admin: <http://localhost:3001>. Native: Expo Go via `bun run dev:native`.
Design prototype lives at <http://localhost:3001/north> (publicly viewable, no auth).

For dev/prod remote Supabase setup, CI auto-deploy, EAS secrets, and the full operator runbook, see **[`docs/supabase-projects.md`](./docs/supabase-projects.md)** (DEC-16).

## UI

Shared shadcn/ui primitives live in `packages/ui`. Tokens and global styles are in `packages/ui/src/styles/globals.css`. Add more primitives with:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

## Layout

```
north/
├── apps/
│   ├── web/         # Admin app (Next.js) + design prototype at /north
│   └── native/      # Product surface (Expo + React Native)
├── packages/
│   ├── ui/          # Shared shadcn/ui components
│   ├── supabase/    # Thin supabase-js client factories (server / browser / native)
│   ├── env/         # Zod-validated env schemas (server / web / native)
│   └── config/      # Shared tsconfig
├── supabase/
│   ├── config.toml
│   └── migrations/  # 0001_init.sql · 0002_rls.sql
└── docs/
    └── north-operating-document.md  # Source of truth; Section 17 is the Decision Log
```

## Available scripts

- `bun run dev` — start all apps
- `bun run dev:web` / `bun run dev:native`
- `bun run build` / `bun run check-types`
- `bun run supabase:start` / `supabase:stop` / `supabase:reset` — local Supabase stack
- `bun run supabase:link:dev` / `supabase:link:prod` — link local CLI to a remote project (see `docs/supabase-projects.md`)
- `bun run check` — Biome format + lint (writes fixes)
- `bun run check:ci` — Biome check-only (fails on diff; used by CI)
- `cd apps/web && bun run generate-pwa-assets` — PWA assets

## Pre-commit hooks

Hooks are managed by [lefthook](https://lefthook.dev) and installed automatically by `bun install`'s `postinstall` script. See `lefthook.yml`.

- **pre-commit:** `bunx biome check --write` on staged JS/TS/JSON/CSS files (auto-staged after fixes) + `bun run check-types` across the workspace.
- Bypass in an emergency with `git commit --no-verify`. Never bypass in CI.
