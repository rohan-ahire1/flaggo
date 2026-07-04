# Plan: Rewrite Flaggo as a React Native (Expo) app — Core MVP (iOS + Android)

## Context

Flaggo (`flaggo`) is a Vite + React 18 **web** PWA. The user wants a full native rewrite
to reach **both iOS and Android** (something TWA/PWA can't do — Apple blocks TWA). Chosen
stack: **React Native + Expo**, chosen scope: **Core MVP first** (prove the stack with the
central loop, then expand to full parity later).

Why RN/Expo over Flutter: the app is already React + TypeScript, and its **entire game-logic
layer is plain, DOM-free TypeScript** — it ports to RN essentially untouched. Only the UI
(DOM/JSX/Tailwind) must be rebuilt. Flutter would discard the logic too (Dart rewrite). So
RN gives a native rewrite while salvaging the hardest-won, most-tested code.

The rewrite lives in a **new Expo project** decoupled from the existing web build (separate
bundlers: Vite vs Metro). The web app is untouched and keeps shipping. Portable logic is
**copied** into the Expo app for the MVP (not shared via monorepo tooling) to keep it simple
and unambiguous; extract a shared package only if/when the rewrite reaches full parity.

## What ports vs what rebuilds (from the web codebase)

### A. Reuse as-is — pure TS, zero DOM (copy verbatim)
- `src/utils/`: `quiz`, `lessonGenerator`, `spacedRepetition` (Leitner), `dailyChallenge`,
  `arcade`, `trivia`, `geo`, `seededRandom`, `decks`, `progressMerge`.
  **Critical:** `seededRandom`/`dailyChallenge`/`matches` are deterministic-seeded so all
  players get identical questions — copy verbatim so mobile stays in parity with web.
- `src/types/`: `country`, `topic`, `progress`, `lesson`, `arcade`.
- `src/data/`: `countries.ts` (generated source of truth), `lookalikes.ts`.
- `src/config/brand.ts`.

### B. Reuse with small tweaks
- `src/utils/storage.ts` — uses `localStorage`; reimplement over **Drizzle + expo-sqlite**
  (typed tables for progress / Leitner review boxes / decks), not AsyncStorage. Keep the
  same function names but async; callers await.
- `src/config/env.ts` — uses `import.meta.env` (Vite-only) and `window.location.origin`.
  Replace with Expo config: `app.config.ts` `extra` + `expo-constants`; drop the
  `window.location` fallback.
- `src/lib/supabase.ts` — `@supabase/supabase-js` runs in RN, but configure the auth client
  with `storage: AsyncStorage`, `detectSessionInUrl: false`, `autoRefreshToken: true`,
  `persistSession: true`.
- `src/lib/leaderboard.ts`, `src/lib/matches.ts` — plain Supabase queries; port with the
  new client. (Multiplayer matches are post-MVP, but the lib copies over cleanly.)
- `src/hooks/useSyncedProgress.ts`, `src/hooks/useEntitlement.ts` — refactor into the new
  state layer: local reads/writes go through Drizzle; the Supabase upsert/fetch/merge becomes
  a **React Query** mutation + query (keeps the debounced anon→user merge logic, drops the
  hand-rolled fetch/effect plumbing).

### C. Full rebuild — web/DOM UI (RN equivalents)
- All `src/screens/*.tsx` and `src/components/*.tsx` — `div/img/button` + Tailwind classes →
  RN `View/Text/Pressable/Image`. Flags currently load from `flagcdn.com` in `<img>` →
  `expo-image` `<Image>` (built-in caching replaces the PWA service-worker flag cache).
- `src/components/Icon.tsx` — inline DOM `<svg>` → `react-native-svg` (reuse the existing
  path `d` data verbatim).
- `src/theme/` + `src/index.css` — the CSS-variable-on-`<html>` theme trick doesn't exist in
  RN. Rebuild as a JS theme object + React context (port the palette values from
  `src/theme/palettes.ts`), consumed via **NativeWind v4** (Tailwind syntax for RN, closest
  to the existing class-based styling → fastest UI port).
- Navigation — `react-router-dom` + the `App.tsx` screen-state-machine → **expo-router**
  (file-based) with a bottom-tab layout mirroring `BottomNav`.
- `src/AppShell.tsx`, `index.html`, `vite-plugin-pwa` — replaced by the Expo app entry.
- `src/lib/analytics.ts` (Plausible, script-loaded) and `src/lib/sentry.ts`
  (`@sentry/react`) — swap to no-op/deferred and `@sentry/react-native` respectively
  (analytics deferred for MVP).
- `src/auth/` (Google OAuth redirect + email magic link) — rebuild with Supabase OAuth via
  `expo-auth-session` / deep links using an app scheme (e.g. `worldly://`).

### Deferred beyond MVP (do NOT build now)
- `WorldMap` + all map modes (`react-simple-maps`/`d3-geo`/`topojson` → `react-native-svg` +
  manual `d3-geo` projection — largest single rebuild).
- Trivia, Decks, Paths, Leaderboard, Friends, Matches/multiplayer, Daily (unless trivial),
  Stripe/monetization, ads.
- Post-MVP stack (add with the matching feature, not now): **Supabase Realtime** (live
  matches + leaderboard), **EAS Build + EAS Update** (CI/CD + OTA), **PostHog** (mobile
  analytics + feature flags), **RevenueCat** (IAP, only if monetization returns).

## MVP definition (the core loop to ship)

Screens (via expo-router tabs): **Home** (topic pick + start), **Lesson/Quiz flow**
(the FlagTest/lesson question loop), **one game mode** (Arcade — reuses `utils/arcade`),
**Profile** (progress summary, sign-in, Supabase sync, theme switch).
Components to rebuild: `FlagImage`, `FlagCard`, `QuestionCard`, `ProgressBar`, a subset of
`Icon`, tab bar.
Data/logic wired in: `quiz`, `lessonGenerator`, `spacedRepetition`, `arcade`, `seededRandom`,
progress `types`, `useSyncedProgress`, `storage`→AsyncStorage, `supabase`, auth.

## Implementation Changes

1. **Scaffold Expo app** — create a TypeScript Expo project in a new `mobile/` folder in the
   repo (keeps web app untouched, separate Metro build). Enable **expo-router**. Configure
   `app.config.ts` with name/slug "Flaggo", scheme `worldly`, iOS bundle id + Android
   package (e.g. `app.worldly`), icon/splash from the existing 512 PNG + `#faf6ee` background.
2. **Install deps** — `expo-router`, `nativewind` + `tailwindcss`, `react-native-svg`,
   `expo-image`, `@supabase/supabase-js`, `expo-auth-session`/`expo-web-browser`,
   `@sentry/react-native` (deferred init). Plus the modern stack:
   - **`@tanstack/react-query`** — all Supabase server-state (reads + mutations).
   - **`zustand`** — client/UI state.
   - **`drizzle-orm` + `expo-sqlite`** (+ `drizzle-kit` dev) — on-device offline DB.
   - **`react-native-reanimated` + `react-native-gesture-handler`** — native animations/gestures.
   - **`@react-native-async-storage/async-storage`** — kept ONLY as the Supabase auth-session
     store (app data lives in SQLite, not AsyncStorage).
3. **Copy portable logic** — copy list (A) into `mobile/src/{utils,types,data,config}`;
   copy + tweak list (B). Fix imports; no logic edits to seeded/quiz code.
4. **Theme** — port `palettes.ts` values into a JS theme object + context; configure NativeWind
   with those tokens so screens style with familiar Tailwind-ish classes.
5. **On-device DB (Drizzle + expo-sqlite)** — define Drizzle schema for progress, review
   (Leitner boxes), and decks; run migrations via `drizzle-kit`. Reimplement `storage.ts`
   over it (same function names, async). This is the offline source of truth.
6. **State layer** — set up a **React Query** `QueryClient` provider for all Supabase
   server-state (progress sync, entitlement, leaderboard later), and a **Zustand** store for
   client/UI state (active topic, in-progress quiz session, theme, transient nav state not
   owned by expo-router). This replaces the `App.tsx` useState machine; the split is
   deliberate — server-state in React Query, client-state in Zustand.
7. **Supabase + auth** — configured client (step B); Supabase session token stored via
   AsyncStorage adapter; implement Google OAuth + magic-link via Supabase + deep link
   (`worldly://auth/callback`); register the redirect in Supabase and `app.config.ts`.
8. **Rebuild MVP UI** — expo-router tab layout + the four MVP screens and the listed
   components, wiring copied logic, the Drizzle store, React Query, and Zustand. Use
   **Reanimated + Gesture Handler** for the answer/interaction polish: `FlagCard` flip on
   reveal, swipe-to-answer, and screen/answer transitions.
9. **Env** — `app.config.ts` `extra` holds `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SITE_URL`;
   read via `expo-constants`. No secrets in the client beyond the anon key (same as web).

## Test Plan (end-to-end)
- `npx expo start` → run on **iOS Simulator** and **Android emulator**; app boots to Home.
- Play a full lesson/quiz and an Arcade round; confirm scoring/quiz logic matches web
  behavior (same seeded questions for the same seed).
- Kill & relaunch app (airplane mode) → progress persisted in the SQLite/Drizzle DB
  (offline, signed-out).
- Sign in (Google + magic link) → deep link returns to app; Profile shows email; progress
  syncs to Supabase (verify a `progress` row updates), and merges anon→user.
- Theme switch re-themes all MVP screens.
- Flags render via `expo-image` from `flagcdn.com` and cache (works on second view offline).
- Later: `eas build` for a device/TestFlight/internal-testing build (not required for MVP
  acceptance).

## Assumptions
- New Expo project in `mobile/`; the existing web app stays as-is and keeps deploying.
- Portable logic is **copied** for the MVP (no monorepo/shared-package tooling yet).
- Same Supabase project/schema as web (RLS unchanged); only client config + auth redirect
  differ. Anon key is the only client secret (already public-safe).
- Monetization/ads remain fully out of scope (flag-gated off, mirroring web MVP).
- Codex implements in the new project; it should not modify the existing web `src/` beyond
  reading files to copy logic from.

## Risks / Acceptance criteria
- **Auth deep-linking** (OAuth redirect + magic link back into the app) is the most fragile
  part — validate the `worldly://` scheme + Supabase redirect early.
- **Seeded parity**: reuse `seededRandom`/`dailyChallenge` verbatim so mobile and web produce
  identical daily/match questions; a mismatch breaks cross-platform fairness.
- **NativeWind setup** (babel/metro config) can be finicky — get a trivial styled screen
  rendering before porting real UI.
- **Sync→async storage**: web `localStorage` is sync; the Drizzle/SQLite layer is async —
  audit every `storage.ts` caller and make it await.
- **New-stack setup cost**: Reanimated (babel plugin), NativeWind (metro/babel), and Drizzle
  migrations all need config wired before feature work — validate each with a trivial smoke
  test first. Worth it for the offline-first + polish payoff, but front-loaded.
- **Done when:** the four MVP screens run on both simulators, the core quiz loop plays,
  progress persists locally and syncs to Supabase after sign-in, and theming works.

---
_Supersedes the earlier TWA plan in this file — user chose a full React Native rewrite
(iOS + Android) over an Android-only web wrapper._
