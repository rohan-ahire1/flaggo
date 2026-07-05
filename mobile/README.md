# Flaggo Mobile (React Native + Expo)

Native iOS + Android rewrite of the Flaggo web app. Core-MVP scope: Home (topic
pick), a lesson/quiz flow, Arcade, and Profile — sharing the web app's game logic.

## Stack

- **Expo SDK 57** + **expo-router** (file-based nav, tabs + a quiz stack screen)
- **NativeWind v4** (Tailwind styling) + a 4-palette theme system (`src/theme`)
- **Drizzle ORM + expo-sqlite** — on-device, offline-first progress store (`src/db`)
- **TanStack Query** — Supabase server-state; **Zustand** — client/UI state (theme)
- **Reanimated + Gesture Handler** — question/answer animations
- **Supabase** — email/password auth + progress sync

### Reused from web (copied, unchanged)

`src/utils` (quiz, spacedRepetition, arcade, seededRandom, …), `src/types`,
`src/data/countries.ts`. Seeded RNG is copied verbatim so daily/match questions
stay identical to the web app.

## Run it

```bash
cd mobile
cp .env.example .env.local   # fill in Supabase URL + anon key (same as web)
npx expo start               # then press i (iOS) / a (Android)
```

The app runs fully offline and signed-out (progress persists in SQLite). Sign-in
and cloud sync require the Supabase env vars above and the `worldly://` scheme
registered as a redirect URL in the Supabase Auth settings.

Because this uses native modules (expo-sqlite, react-native-svg, reanimated,
@sentry/react-native), use a **development build** (`npx expo run:ios` /
`run:android`) rather than Expo Go for a fully accurate run.

## Validate the bundle

```bash
npx tsc --noEmit                 # type-check
npx expo export --platform ios   # full Metro bundle (no simulator needed)
```

## Not yet ported (post-MVP)

World map + map modes, trivia, decks, paths, leaderboard, friends, multiplayer
matches, daily challenge, ads/billing. See `../plans/react-native-expo-mvp.plan.md`.
