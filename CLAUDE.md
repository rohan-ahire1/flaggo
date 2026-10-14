# CLAUDE.md — Flaggo (repo: `flaggo`)

Codebase guide for Claude Code sessions. Keep it current as the app evolves.

## Overview

Flaggo (internal repo name `flaggo`, brand "Flaggo", tagline "Master the world,
one round at a time") is a flags/geography learning game. Players learn and test
themselves on countries across topics — flags, capitals, map locations, currencies,
languages, and bordering neighbors — through lessons, a daily challenge, an arcade
mode, trivia, map play, spaced-repetition review, and custom decks. Single-player only
(multiplayer matches, friends, and leaderboards were removed). Progress is saved locally
and synced to Supabase when signed in. It's a mobile-first installable PWA. The free MVP keeps
Stripe checkout and AdSense code in the repo but disabled behind feature flags.

## Tech stack

- **Build/dev:** Vite 5 (`vite.config.ts`), TypeScript 5 (`tsc -b` then `vite build`).
- **UI:** React 18, `react-router-dom` 7, Tailwind CSS 3 (`tailwind.config.js`).
- **PWA:** `vite-plugin-pwa` (autoUpdate; CacheFirst for `flagcdn.com` flag assets).
- **Maps:** `react-simple-maps` + `d3-geo` + `topojson-client` + `world-atlas`
  (TopoJSON in `packages/core/src/data/world-110m.json`).
- **Backend:** `@supabase/supabase-js` (Auth + Postgres + RLS). No dedicated server-state
  lib — app state is plain React `useState`/context + a synced-progress hook.
- **Payments (deferred):** `@stripe/stripe-js` (client), `stripe` (Flaggo API in `server/`).
- **Diagnostics/analytics:** `@sentry/react`, Plausible (script-loaded), both opt-in via env.
- **Hosting:** the VPS — Caddy serves `dist/` and proxies `/api/*` to the Flaggo API
  (`server/`, a small Node service). Deploy files are in `deploy/`.
- **Tests:** Vitest + Testing Library + jsdom (`*.test.ts(x)` colocated in `__tests__/`).

## Architecture (high level)

`src/`
- `main.tsx` → renders `AppShell` inside a Sentry `ErrorBoundary`.
- `AppShell.tsx` → `BrowserRouter` + `ThemeProvider` + `AuthProvider`; routes:
  `/` (main app), `/privacy`, `/terms`, `/auth/callback`, `*` (404). Plausible pageview tracking.
- `App.tsx` → the actual game. Single-page **screen state machine** (`screen` useState, type
  `Screen`), NOT routed. ~22 screens in `src/screens/`; heavier ones are `React.lazy` loaded.
  Reads a `?m=<matchId>` query param to deep-link into a multiplayer match.
- `screens/` — one component per mode (Home, Welcome, Lesson, FlagTest, Trivia, Arcade,
  Daily, Paths, Decks, Map menu/play/explore, Leaderboard, Friends, Match/MatchResult,
  Review, Stats, Profile, TestSetup, LessonComplete).
- `components/` — shared UI (FlagCard, FlagImage, WorldMap, QuestionCard, BottomNav, etc.).
- `pages/` — route-level pages (AuthCallback, Legal, NotFound, Pro).
- `hooks/` — `useSyncedProgress` (local↔Supabase progress sync, debounced upserts, anon→user
  merge), `useEntitlement` (ads-removed entitlement).
- `lib/` — `supabase.ts` (client, null if unconfigured), `analytics.ts`, `sentry.ts`.
- `packages/core/src/utils/` — shared game logic: `quiz`, `lessonGenerator`, `spacedRepetition` (Leitner boxes),
  `dailyChallenge`, `arcade`, `trivia`, `geo`, `seededRandom` (deterministic seeded RNG so
  matches/daily are reproducible), `decks`, `storage` (localStorage), `progressMerge`.
- `packages/core/src/types/` — `country`, `topic`, `progress`, `lesson`, `arcade`.
- `config/` — `brand.ts` (name/url), `env.ts` (typed client env + required-key assertion).
- `auth/` — `AuthProvider` (session + display_name), `SignInModal` (email/password auth).
- `ads/`, `theme/` — feature-flagged ads, theme palettes/provider (light default).

### Game data

- `countries.raw.json` (repo root, ~250 entries from restcountries-style source) is the input.
- `scripts/generateCountries.ts` (`npm run generate:countries`) transforms it into
  `packages/core/src/data/countries.ts` (typed `Country[]`, the runtime source of truth). Adds difficulty
  buckets, `flagcdn.com` flag URLs, normalized continents, neighbor codes, etc.
- Flag images load from `https://flagcdn.com/<cc>.svg` (cached by the PWA service worker).
- Map geometry: `packages/core/src/data/world-110m.json` (TopoJSON). `packages/core/src/data/lookalikes.ts` lists
  visually similar flags for harder distractors.

### Supabase

`supabase/migrations/*.sql` (apply in filename order). Also `supabase/setup.sql` =
combined idempotent paste-into-SQL-editor version. Tables (all RLS-enabled):
`profiles`, `progress` (jsonb blob), `entitlements`, `purchases`. (Social tables were
dropped by migration `202607120001_drop_social.sql`.)
A signup trigger (`handle_new_user`) seeds profile/progress/entitlements rows. Display
names never store email (PII fix in migration `…0004`). See `docs/ARCHITECTURE.md`.

### Flaggo API (`server/`)

`server/index.ts` is a small `node:http` server that routes `/api/<name>` to the handlers in
`server/functions/`. It is bundled to one file (`npm run build:server`) and runs on the VPS as
`flaggo-api.service`. Handlers are server-only and use the Supabase **service role** key:
- `username-signup.ts` — wired/active; creates username-only accounts.
- `delete-account.ts` — wired/active; verifies bearer token, admin-deletes the auth user.
- `create-checkout-session.ts`, `stripe-webhook.ts` — Stripe, **deferred** (monetization off).
  Caddy also maps `/stripe-webhook` to `/api/stripe-webhook`.

## Env vars

Copy `.env.example` → `.env.local`. Client vars are `VITE_*` (browser-exposed, no secrets).

- **Required:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`.
- **Flags:** `VITE_ADS_ENABLED` (default false), `VITE_MONETIZATION_ENABLED` (default false).
- **Optional:** `VITE_PLAUSIBLE_DOMAIN`, `VITE_SENTRY_DSN`, `VITE_ADSENSE_CLIENT_ID`,
  `VITE_STRIPE_PUBLISHABLE_KEY`.
- **Server-only (Flaggo API, never `VITE_`):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.

Missing required keys throw in dev; in prod the app degrades (supabase client is `null`,
app runs local-only).

## Commands

```bash
npm install
npm run dev                  # Vite dev server (localhost:5173); proxies /api to :8796
npm run dev:api              # Flaggo API on :8796 (needs server-only env in the shell)
npm run build                # tsc -b && vite build  -> dist/
npm run build:server         # bundle the API -> server/dist/flaggo-api.mjs
npm run preview              # preview the production build
npm test                     # vitest run
npm run generate:countries   # regenerate packages/core/src/data/countries.ts from countries.raw.json
```

**Deploy (VPS):** `flaggo-deploy.timer` on the VPS checks `origin/main` every 5 minutes and,
when it moved, builds the web app and API and publishes them (`deploy/vps-deploy.sh`). So
a push to `main` is a production deploy — don't push or merge to `main` unless asked.
Build env is `/etc/flaggo/build.env`; API secrets are `/etc/flaggo/api.env`. See
`docs/production-setup.md`. There is no Netlify dependency; don't add one.

## Conventions

- Caveman/terse prose is for chat only — write normal prose in docs and `.plan.md` files.
- New screens are added to `App.tsx`'s `Screen` union + the render switch; lazy-load heavy ones.
- Keep monetization isolated and flag-gated; never surface paywall CTAs when
  `VITE_MONETIZATION_ENABLED` is false.
- Public display names must never be emails — use `sanitizeDisplayName` / `isPublicSafeHandle`.
- Matches and the daily challenge are **seeded** (deterministic) so all players get the same
  questions; preserve that when touching `packages/core/src/utils/seededRandom`, `dailyChallenge`.
- Plans live in `plans/` (`*.plan.md`). See `plans/launch-free-mvp.plan.md` for launch intent.
</content>
