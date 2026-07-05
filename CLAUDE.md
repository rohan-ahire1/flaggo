# CLAUDE.md — Flaggo (repo: `flaggo`)

Codebase guide for Claude Code sessions. Keep it current as the app evolves.

## Overview

Flaggo (internal repo name `flaggo`, brand "Flaggo", tagline "Master the world,
one round at a time") is a flags/geography learning game. Players learn and test
themselves on countries across topics — flags, capitals, map locations, currencies,
languages, and bordering neighbors — through lessons, a daily challenge, an arcade
mode, trivia, map play, spaced-repetition review, custom decks, public leaderboards,
and shareable head-to-head multiplayer "matches". Progress is saved locally and synced
to Supabase when signed in. It's a mobile-first installable PWA. The free MVP keeps
Stripe checkout and AdSense code in the repo but disabled behind feature flags.

## Tech stack

- **Build/dev:** Vite 5 (`vite.config.ts`), TypeScript 5 (`tsc -b` then `vite build`).
- **UI:** React 18, `react-router-dom` 7, Tailwind CSS 3 (`tailwind.config.js`).
- **PWA:** `vite-plugin-pwa` (autoUpdate; CacheFirst for `flagcdn.com` flag assets).
- **Maps:** `react-simple-maps` + `d3-geo` + `topojson-client` + `world-atlas`
  (TopoJSON in `src/data/world-110m.json`).
- **Backend:** `@supabase/supabase-js` (Auth + Postgres + RLS). No dedicated server-state
  lib — app state is plain React `useState`/context + a synced-progress hook.
- **Payments (deferred):** `@stripe/stripe-js` (client), `stripe` (Netlify functions).
- **Diagnostics/analytics:** `@sentry/react`, Plausible (script-loaded), both opt-in via env.
- **Hosting:** Netlify static + Netlify Functions (`netlify.toml`).
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
- `lib/` — `supabase.ts` (client, null if unconfigured), `leaderboard.ts`, `matches.ts`,
  `analytics.ts`, `sentry.ts`.
- `utils/` — game logic: `quiz`, `lessonGenerator`, `spacedRepetition` (Leitner boxes),
  `dailyChallenge`, `arcade`, `trivia`, `geo`, `seededRandom` (deterministic seeded RNG so
  matches/daily are reproducible), `decks`, `storage` (localStorage), `progressMerge`.
- `types/` — `country`, `topic`, `progress`, `lesson`, `arcade`.
- `config/` — `brand.ts` (name/url), `env.ts` (typed client env + required-key assertion).
- `auth/` — `AuthProvider` (session + display_name), `SignInModal` (email/password auth).
- `ads/`, `theme/` — feature-flagged ads, theme palettes/provider (light default).

### Game data

- `countries.raw.json` (repo root, ~250 entries from restcountries-style source) is the input.
- `scripts/generateCountries.ts` (`npm run generate:countries`) transforms it into
  `src/data/countries.ts` (typed `Country[]`, the runtime source of truth). Adds difficulty
  buckets, `flagcdn.com` flag URLs, normalized continents, neighbor codes, etc.
- Flag images load from `https://flagcdn.com/<cc>.svg` (cached by the PWA service worker).
- Map geometry: `src/data/world-110m.json` (TopoJSON). `src/data/lookalikes.ts` lists
  visually similar flags for harder distractors.

### Supabase

`supabase/migrations/*.sql` (apply in filename order). Also `supabase/setup.sql` =
combined idempotent paste-into-SQL-editor version. Tables (all RLS-enabled):
`profiles`, `progress` (jsonb blob), `entitlements`, `purchases`, `leaderboard_scores`,
`matches`, `match_results`, `friend_links`. RPCs: `top_scores`, `friends_leaderboard`.
A signup trigger (`handle_new_user`) seeds profile/progress/entitlements rows. Display
names never store email (PII fix in migration `…0004`). See `docs/ARCHITECTURE.md`.

### Netlify Functions (`netlify/functions/`)

Server-only, use the Supabase **service role** key:
- `delete-account.ts` — wired/active; verifies bearer token, admin-deletes the auth user.
- `create-checkout-session.ts`, `stripe-webhook.ts` — Stripe, **deferred** (monetization off).
  `stripe-webhook` is redirected from `/stripe-webhook` in `netlify.toml`.

## Env vars

Copy `.env.example` → `.env.local`. Client vars are `VITE_*` (browser-exposed, no secrets).

- **Required:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`.
- **Flags:** `VITE_ADS_ENABLED` (default false), `VITE_MONETIZATION_ENABLED` (default false).
- **Optional:** `VITE_PLAUSIBLE_DOMAIN`, `VITE_SENTRY_DSN`, `VITE_ADSENSE_CLIENT_ID`,
  `VITE_STRIPE_PUBLISHABLE_KEY`.
- **Server-only (Netlify, never `VITE_`):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.

Missing required keys throw in dev; in prod the app degrades (supabase client is `null`,
app runs local-only).

## Commands

```bash
npm install
npm run dev                  # Vite dev server (localhost:5173)
npm run build                # tsc -b && vite build  -> dist/
npm run preview              # preview the production build
npm test                     # vitest run
npm run generate:countries   # regenerate src/data/countries.ts from countries.raw.json
```

**Deploy (Netlify):** build `npm run build`, publish `dist`, functions `netlify/functions`.
SPA + function redirects in `netlify.toml`. Set the required `VITE_*` env in Netlify; set
server-only keys for `delete-account` (and Stripe if/when monetization is enabled).

Do not deploy to Netlify production unless explicitly asked to do so. Git-based
production builds are skipped by default through `scripts/netlify-ignore-build.cjs`;
include `[deploy]` in the commit message only when an intentional production release is
requested. For manual testing, use `netlify deploy` for preview deploys and avoid
`netlify deploy --prod` unless production deployment was explicitly requested.

## Conventions

- Caveman/terse prose is for chat only — write normal prose in docs and `.plan.md` files.
- New screens are added to `App.tsx`'s `Screen` union + the render switch; lazy-load heavy ones.
- Keep monetization isolated and flag-gated; never surface paywall CTAs when
  `VITE_MONETIZATION_ENABLED` is false.
- Public display names must never be emails — use `sanitizeDisplayName` / `isPublicSafeHandle`.
- Matches and the daily challenge are **seeded** (deterministic) so all players get the same
  questions; preserve that when touching `utils/seededRandom`, `matches`, `dailyChallenge`.
- Plans live in `plans/` (`*.plan.md`). See `plans/launch-free-mvp.plan.md` for launch intent.
</content>
