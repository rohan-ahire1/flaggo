# Flaggo

**Master world geography, one round at a time.**

Live: [flaggo.rohanahire.com](https://flaggo.rohanahire.com)

![Flaggo social preview](public/og-image.svg)

## What it does

Flaggo is a geography learning game that installs like an app on your phone. You learn flags first, in four stages ordered from the most familiar countries to the least, then test yourself on capitals, map locations, currencies, languages and neighboring countries. A spaced-repetition review brings back the ones you keep missing.

It works fully offline and without an account. Signing in only adds cloud sync of your progress.

## Key features

- **Progressive flag learning** in four stages, with badges as you complete each one.
- **Many ways to practice:** flashcards, tests (recall only, or with options), map play and a free-explore map, trivia, an arcade mode (including sudden death), and a daily challenge that is the same for everyone that day.
- **Spaced repetition** using Leitner boxes (review after 1, 3, 7, 14 and 30 days), plus custom decks and a browsable flag library.
- **Smart wrong answers.** Multiple-choice options include look-alike flags, so you can't guess by elimination.
- **Kids mode** with region-based flag learning, find-the-flag and matching games, a sticker book, and a parental gate (a simple multiplication on a tap keypad) for grown-up actions.
- **Four themes** (Ocean & Atlas, Parchment, Topographic, Slate), with the choice saved.
- **Accounts with just a username and password**, cloud progress sync that merges local and remote progress, and self-service account deletion.
- **Installable PWA** with an offline app shell and cached flag images.

## Tech stack

- React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query
- `react-simple-maps`, `d3-geo` and TopoJSON world data for the maps
- Supabase (Auth, Postgres with row-level security)
- A small Node API (`server/`) for privileged routes, bundled with esbuild
- `vite-plugin-pwa` (Workbox) for offline support
- Vitest and Testing Library
- Optional Sentry and Plausible
- Self-hosted on a VPS behind Caddy

## Architecture notes

- **Game logic is a separate package.** `packages/core` (an npm workspace) holds the country data, question generation, spaced repetition, daily challenge, arcade scoring, progress merging and seeded random numbers. It is pure TypeScript with its own tests, and the React app only renders it.
- **Client-first.** Country data and world map geometry are bundled at build time, so every mode works offline. Flag SVGs come from flagcdn.com and are cached by the service worker.
- **Deterministic daily challenge.** The date is hashed into a seed for a small PRNG (mulberry32), so everyone gets the same questions without a server.
- **Least-privilege backend.** The browser talks to Supabase with the public key under row-level security. Only the Node API holds the service-role key, and it does just three things: username sign-up, account deletion and (switched off for now) Stripe checkout and webhooks.
- **Pull-based deploys.** A systemd timer on the VPS checks `main` every 5 minutes. When it has moved, an unprivileged build user with a read-only deploy key builds the site and the API, then publishes them.
- **Monetization switched off.** Stripe checkout and AdSense code are in the repo but hidden behind the `VITE_MONETIZATION_ENABLED` and `VITE_ADS_ENABLED` flags.

## Run it locally

Use the Node version in `.nvmrc` (22).

```bash
npm install
cp .env.example .env.local   # add your Supabase URL and anon key
npm run dev                  # http://localhost:5173
```

```bash
npm test             # vitest
npm run build        # typecheck and production build
npm run dev:api      # run the Node API locally (needs the server-only variables)
```

### Environment variables

Browser variables (`VITE_*`) are public, so never put secrets in them.

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `VITE_SITE_URL` | Yes | Used for auth callbacks and share links |
| `VITE_ADS_ENABLED` | No | Default `false` |
| `VITE_MONETIZATION_ENABLED` | No | Default `false` |
| `VITE_PLAUSIBLE_DOMAIN` | No | Turns on Plausible analytics |
| `VITE_SENTRY_DSN` | No | Turns on Sentry |
| `VITE_ADSENSE_CLIENT_ID`, `VITE_STRIPE_PUBLISHABLE_KEY` | No | Only used when ads or monetization are on |

Server-only, for the Node API:

| Variable | Notes |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Username sign-up and account deletion |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | Checkout, currently off |

### Database

Apply the SQL files in `supabase/migrations/` to a new Supabase project in filename order. They create the tables and enable row-level security.

## Project layout

```
src/            React app: screens, components, auth, theme, navigation
src/screens/    One screen per mode, plus kids/
packages/core/  Pure game logic and data, shared and tested
server/         Node API for privileged routes
supabase/       SQL migrations
deploy/         Caddy, systemd units and VPS setup/deploy scripts
docs/           Architecture and production setup notes
```
