# Flaggo

**Master world geography, one round at a time.**

Flaggo is a responsive geography-learning game with multiple practice modes, spaced repetition, optional account sync, leaderboards and shareable multiplayer challenges.

![Flaggo social preview](public/og-image.svg)

## Features

### Learning modes

- flag identification
- capitals
- geography trivia
- map-based questions
- arcade rounds
- daily challenges
- review practice driven by prior mistakes

### Progress and social features

- local-first progress storage
- Supabase sync when signed in
- spaced-repetition review scheduling
- public leaderboards
- friend links
- shareable multiplayer matches
- persistent theme preferences

### Platform features

- installable progressive web app
- offline application shell and cached flag assets
- responsive mobile and desktop layouts
- optional Plausible analytics
- optional Sentry diagnostics
- deferred Stripe and AdSense integrations behind feature flags

## Technology

- React 18 and TypeScript
- Vite
- React Router
- Tailwind CSS
- Supabase Auth, Postgres and Row Level Security
- Netlify static hosting and serverless functions
- Vitest and Testing Library
- `vite-plugin-pwa`
- D3 Geo, TopoJSON and world-atlas data

## Local development

### Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project for authentication and cloud sync

```bash
git clone https://github.com/rohan-ahire1/flaggo.git
cd flaggo
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Minimum client configuration:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SITE_URL=http://localhost:5173
VITE_ADS_ENABLED=false
VITE_MONETIZATION_ENABLED=false
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build production assets |
| `npm run preview` | Preview the production build |
| `npm test` | Run the Vitest suite once |
| `npm run generate:countries` | Regenerate country data through `scripts/generateCountries.ts` |

## Environment variables

### Browser variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | — | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | — | Public anonymous key; RLS must protect data |
| `VITE_SITE_URL` | Recommended | current origin | Auth callbacks and share URLs |
| `VITE_ADS_ENABLED` | No | `false` | Enables ad slots and consent UI |
| `VITE_MONETIZATION_ENABLED` | No | `false` | Enables premium/checkout UI |
| `VITE_PLAUSIBLE_DOMAIN` | No | — | Enables Plausible analytics |
| `VITE_SENTRY_DSN` | No | — | Enables Sentry diagnostics |
| `VITE_ADSENSE_CLIENT_ID` | No | — | Used only when ads are enabled |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | — | Reserved for checkout UI |

### Netlify function variables

| Variable | Used for |
| --- | --- |
| `SUPABASE_URL` | Server-side Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | Account deletion and privileged writes |
| `STRIPE_SECRET_KEY` | Deferred Stripe operations |
| `STRIPE_PRICE_ID` | Checkout session creation |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification |

Never expose `SUPABASE_SERVICE_ROLE_KEY` or Stripe secrets through a `VITE_` variable.

## Supabase setup

Apply the migrations in order:

1. `supabase/migrations/202606180001_flaggo_v1.sql`
2. `supabase/migrations/202606180002_leaderboards.sql`
3. `supabase/migrations/202606180003_matches.sql`
4. `supabase/migrations/202606180004_handle_no_email.sql`

The schema covers profiles, progress, entitlements, purchases, leaderboards, matches, match results and friend links, with Row Level Security enabled.

Configure the authentication providers used by `src/auth/SignInModal.tsx`, including matching callback URLs for local development and production.

## Data model and sync behavior

Flaggo is local-first: a player can practice without signing in. Authentication adds cloud persistence and social features.

```text
Anonymous player
  └── local preferences and progress

Signed-in player
  ├── local state
  ├── synced profile/progress
  ├── leaderboard entries
  ├── friend links
  └── multiplayer matches/results
```

When changing synchronization code, test first sign-in, repeated sign-in, offline progress, account switching and conflict behavior. Avoid overwriting newer progress with stale local state.

## Feature flags

The free MVP should run with:

```env
VITE_ADS_ENABLED=false
VITE_MONETIZATION_ENABLED=false
```

Stripe and AdSense code remains available for later releases but should not affect free-launch behavior while those flags are disabled.

## Deployment

Recommended Netlify settings:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |

Set the required Supabase client values and `VITE_SITE_URL`. Keep monetization flags disabled unless the complete payment, webhook, entitlement, consent and account-recovery flows have been tested.

## Testing

```bash
npm test
npm run build
```

A production smoke test should cover:

- anonymous play and local progress
- Google OAuth and email magic-link sign-in
- progress synchronization
- one complete round in every major mode
- review scheduling after incorrect answers
- leaderboards
- multiplayer creation, joining and result persistence
- friend links and deep links
- theme persistence
- account deletion
- offline/PWA behavior
- generated country data
- OG/social preview metadata

## Security and privacy

- Protect every user-owned table with RLS; the anonymous key is public by design.
- Keep the service-role key only in server-side functions.
- Verify multiplayer writes cannot impersonate another player.
- Validate account-deletion requests server-side.
- Do not enable analytics, diagnostics or ads without documenting user-data behavior.
- Verify Stripe webhook signatures before changing entitlements.

## Project status

Flaggo contains a broad MVP feature set. Monetization is intentionally deferred and hidden by default. Before a public launch, prioritize end-to-end testing, accessibility checks, RLS review, offline failure handling and production monitoring.