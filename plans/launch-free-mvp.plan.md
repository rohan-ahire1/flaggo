# Flaggo (Flaggo) — Free MVP Launch Plan

## Summary

Get Flaggo/Flaggo across the finish line as a **free, public MVP** ready to post on
subreddits. Scope is free-only: the game, auth, leaderboards, and multiplayer must work
end-to-end; Stripe checkout and AdSense are **deferred behind feature flags** (code stays
in the repo but is disabled and not surfaced in the UI). Finish the in-progress theming
work (new `ThemeProvider`, palettes, `ThemeSwitcher`) and ship to Netlify with Supabase.

This plan assumes the current uncommitted theming WIP is **kept and completed**, not reverted.

## Current State (as inspected)

- Vite + React + TypeScript + Tailwind, PWA, Supabase, Stripe, Sentry, Plausible.
- 22 screens (Home, Welcome, Profile, FlagTest, Trivia, Map play/menu/explore, Decks,
  Paths, Lessons, Daily Challenge, Arcade, Match/multiplayer, Leaderboard, Friends, Stats…).
- Netlify functions: `create-checkout-session.ts`, `stripe-webhook.ts`, `delete-account.ts`.
- Supabase migrations: v1, leaderboards, matches, handle_no_email.
- Monetization is isolated: `src/ads/AdSlot.tsx`, `src/ads/adsense.ts`, `src/config/env.ts`.
- **No README** in repo.
- Uncommitted WIP: theming system (`src/theme/ThemeProvider.tsx`, `src/theme/palettes.ts`,
  `src/components/ThemeSwitcher.tsx`) plus redesign of Home/Welcome/Profile/BottomNav/Icon/
  WorldMap, `index.css`, `tailwind.config.js`, `index.html`.

## Implementation Changes

### 1. Finish the theming WIP
- Complete and stabilize the new theme system: `ThemeProvider` must wrap the app in
  `AppShell.tsx`, persist the selected palette to `localStorage`, and default to a **light
  palette** (user prefers light themes).
- Ensure `ThemeSwitcher` is reachable from `ProfileScreen` (settings area).
- Audit all 22 screens for hardcoded colors that break under the new palette tokens. At
  minimum verify the screens NOT touched by the WIP diff (Arcade, Decks, Paths, Lessons,
  Daily Challenge, Match, Leaderboard, Friends, Stats, Trivia, Map*, FlagTest, Review,
  TestSetup) still render correctly with the new tokens — fix contrast/legibility breaks.
- Remove any half-wired references; the build must have zero TypeScript errors and zero
  unused-theme warnings.

### 2. Free-MVP feature flagging (defer monetization)
- In `src/config/env.ts`, ensure `VITE_ADS_ENABLED` defaults to `false` and is read as a
  boolean. When false, `AdSlot` renders **nothing** (no layout gap, no console errors).
- Hide every premium/upgrade/paywall CTA in the UI behind a single `MONETIZATION_ENABLED`
  flag (default `false`) derived from env. Do not delete the Stripe code paths.
- The `create-checkout-session` and `stripe-webhook` Netlify functions stay in the repo but
  are never invoked by the free build; confirm no UI path calls them when the flag is off.
- `delete-account` function MUST remain wired and reachable from Profile (account deletion is
  a Play/privacy and Reddit-trust requirement).

### 3. Supabase setup (production project)
- Apply all four migrations in order to a fresh production Supabase project.
- Verify Row Level Security policies exist for: user profiles, leaderboards, matches. A free
  public launch means untrusted users — RLS gaps are the top risk. If any table lacks RLS,
  add policies (owner-can-write, public-can-read where appropriate for leaderboards).
- Configure Supabase Auth: enable the providers the app uses (confirm in `src` which providers
  are referenced — email and/or anonymous). `handle_no_email` migration implies anonymous/no-
  email accounts are supported; verify the trigger works.

### 4. Deployment (Netlify)
- Connect the repo to Netlify, build command `npm run build`, publish `dist/`, functions dir
  `netlify/functions` (already in `netlify.toml`).
- Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`,
  `VITE_ADS_ENABLED=false`, `VITE_PLAUSIBLE_DOMAIN` (optional), `VITE_SENTRY_DSN` (optional).
  Do NOT set Stripe/AdSense client keys for the free launch.
- Confirm the SPA redirect (catch-all to `index.html`) exists in `netlify.toml` alongside the
  existing `/stripe-webhook` redirect so deep links and PWA routes work.
- Verify PWA: manifest, icons, installability, offline shell.

### 5. README + launch polish
- Write a `README.md`: one-line pitch ("Flaggo — master world geography, one round at a
  time"), screenshot/GIF, feature list, stack, local-dev setup, env var table, deploy notes.
- Confirm social/OG meta in `index.html` (title, description, og:image) renders a good
  link preview — Reddit auto-embeds these. Provide a 1200×630 `og:image`.
- Set a sensible favicon and PWA name/short_name to "Flaggo".

## Test Plan

Manual + automated. Codex must verify, not assume.

1. `npm install && npm run build` — zero errors.
2. Run existing tests (`netlify/functions/__tests__`) — all pass.
3. Local smoke (`npm run dev`) walkthrough with `VITE_ADS_ENABLED=false`:
   - New user can sign in (or play anonymously) and a profile row is created.
   - Play one full Flag test, one Trivia round, one Map round — scores persist.
   - Daily Challenge loads and is completable.
   - Leaderboard reads back the score just recorded.
   - One multiplayer match completes between two browser sessions (or documents the exact
     manual steps if a second client can't be simulated).
   - Theme switch toggles palettes and persists across reload; default is light.
   - No ad slots, no premium CTAs visible; no console errors referencing Stripe/AdSense.
   - Account deletion removes the user and their rows.
4. Deployed-site smoke on Netlify URL: PWA installs, deep links work, OG preview renders
   (test by pasting the URL into a Reddit post draft or an OG debugger).
5. Mobile check on a real phone (responsive layout, bottom nav, map interactions).

## Assumptions

- Theming WIP is kept and completed (user-confirmed).
- Free launch only; Stripe + AdSense deferred behind flags, code retained (user-confirmed).
- A production Supabase project and a Netlify account/site will be provisioned by the user;
  Codex wires config and documents required secrets.
- Default theme is light (user preference).
- "Flaggo" is the public product name (per current OG meta); keep it consistent everywhere.

## Risks & Acceptance Criteria

**Risks**
- Supabase RLS gaps → data tampering on a public leaderboard. Must be verified before launch.
- Theme refactor breaking untouched screens (only ~10 of 22 screens are in the WIP diff).
- Multiplayer/matches relying on realtime that may not be configured in the new Supabase project.

**Acceptance criteria (launch-ready)**
- Clean production build, all tests pass.
- Deployed Netlify URL playable end-to-end by a brand-new user with no setup.
- All gameplay modes load without errors; scores + leaderboard persist; RLS enforced.
- No monetization UI visible; no broken Stripe/ads calls.
- README + OG preview + PWA install all present and correct.
