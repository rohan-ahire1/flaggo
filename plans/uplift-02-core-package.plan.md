# Uplift Phase 2 — Shared Core Package + Rule Unification

## Summary

Extract the duplicated game logic (`utils`, `types`, `data`, pure match/board helpers) into
a single source-level package `packages/core` consumed by both the web app (Vite) and the
mobile app (Expo/Metro) via path aliases. Unify the drifted game rules: daily challenge is
5 questions, seeded by UTC date, identical on both platforms. Remove web lesson gating.
Delete dead web components.

## Implementation Changes

### 1. Create `packages/core`

- `packages/core/package.json`: `{ "name": "@flaggo/core", "version": "0.1.0",
  "private": true, "type": "module", "main": "src/index.ts", "types": "src/index.ts" }`.
  No build step — both bundlers consume TS source directly.
- `packages/core/tsconfig.json`: extends nothing; `strict: true`, `module: esnext`,
  `moduleResolution: bundler`, `target: es2022`, `resolveJsonModule: true`, `noEmit: true`.
- Move (single canonical copy) into `packages/core/src/`:
  - `types/`: `country.ts`, `topic.ts`, `progress.ts`, `lesson.ts`, `arcade.ts`.
  - `utils/`: `quiz.ts`, `lessonGenerator.ts`, `spacedRepetition.ts`, `dailyChallenge.ts`,
    `arcade.ts`, `trivia.ts`, `decks.ts`, `difficulty.ts`, `popularity.ts`,
    `seededRandom.ts`, `date.ts`, `geo.ts`, `progressMerge.ts`.
  - `data/`: `countries.ts`, `lookalikes.ts`, `world-110m.json`.
  - New `game/answerLabel.ts`: one `answerLabel(question)` covering all `Question` types
    (consolidates the five identical copies in `LessonScreen`, `DailyChallengeScreen`,
    `ArcadeScreen`, `MatchScreen` and mobile `describeQuestion` usage sites). Signature:
    accepts a `Question` and returns the display string; also export a variant for the
    daily/match wrapper objects if the web screens need it.
  - New `game/boards.ts`: move the pure board-id helpers `dailyBoard`, `arcadeBoard`,
    `xpBoard` out of both `lib/leaderboard.ts` files (each app's `lib/leaderboard.ts` keeps
    the Supabase calls and re-exports the ids from core).
  - New `game/matchConfig.ts`: move the pure pieces of both `lib/matches.ts`
    (`MatchConfig` type, `normalizeMatchConfig`, `defaultMatchConfig`,
    `buildMatchQuestions`, `winnerFromResults`, `buildRematchConfig`). Each app's
    `lib/matches.ts` keeps Supabase I/O (`createMatch`, `getMatch`, `getMatchResults`,
    `submitMatchResult`, `matchUrl`, `getFriendsLeaderboard`) and imports the pure parts.
- `packages/core/src/index.ts`: barrel re-exporting everything above.
- **Drift reconciliation rule:** where web `src/` and `mobile/src/` copies differ, the web
  version is canonical EXCEPT: (a) `dailyChallenge.ts` — see §3; (b) `progressMerge.ts` —
  keep the web version but verify mobile's normalize behavior (topic fallback in
  `parseReviewKey`) is preserved; (c) any mobile-only exports that web lacks (e.g.
  `describeQuestion` stays in `mobile/src/quiz/` — it is presentation-layer, not core).
- Streak helpers: keep `updateStreak` in core `utils/date.ts`. Delete mobile's local
  `bumpStreak` in `mobile/src/app/quiz.tsx` and use `updateStreak` from core (verify
  identical daily-boundary semantics; `updateStreak` is canonical).

### 2. Wire both apps to the package

- Root `package.json`: add `"workspaces": ["packages/core"]` (root remains the web app
  package). Run `npm install` so the workspace link exists.
- Web:
  - `tsconfig.app.json` (and `tsconfig.node.json` if needed): add
    `"paths": { "@flaggo/core": ["./packages/core/src/index.ts"], "@flaggo/core/*":
    ["./packages/core/src/*"] }` with matching `baseUrl`.
  - `vite.config.ts`: `resolve.alias` for `@flaggo/core` → `path.resolve(__dirname,
    "packages/core/src")`; ensure `server.fs.allow` includes the repo root if Vite
    complains.
  - Update every web import of the moved modules to `@flaggo/core` (mechanical). Delete
    the moved files from `src/utils`, `src/types`, `src/data` (keep `src/utils/storage.ts`,
    `src/utils/preloadFlags.ts` — app-specific).
  - Move web `src/utils/__tests__/*` for moved modules to `packages/core/src/**/__tests__/`
    and update their relative imports; confirm the vitest glob picks them up (adjust
    `vite.config.ts` test.include to add `packages/core/**/*.test.ts` if needed).
- Mobile:
  - `mobile/tsconfig.json`: add the same `paths` mapping (relative:
    `../packages/core/src/...`).
  - `mobile/metro.config.js`: add `config.watchFolders = [path.resolve(__dirname, "..",
    "packages", "core")]` and `config.resolver.extraNodeModules["@flaggo/core"] =
    path.resolve(__dirname, "..", "packages", "core", "src")`; keep existing NativeWind
    wiring intact.
  - Update mobile imports of the moved modules to `@flaggo/core`; delete the duplicated
    files from `mobile/src/utils`, `mobile/src/types`, `mobile/src/data` (keep
    `mobile/src/utils/storage.ts`, `nav.ts`, `preloadFlags.ts` if app-specific).
- `scripts/generateCountries.ts`: output path becomes
  `packages/core/src/data/countries.ts`; update the header comment and `README.md` /
  `CLAUDE.md` / `docs/ARCHITECTURE.md` references to the new path.

### 3. Unify daily challenge: 5 questions, UTC, no map questions

- Core `dailyChallenge.ts`: `DAILY_QUESTION_COUNT = 5`. `buildDailyQuiz(dateKey, countries)`
  produces exactly 5 questions with NO `location` topic (drop the map-question branch —
  mobile already excludes it; this makes daily fully renderable by `QuestionCard` on both
  platforms). Remove the `includeLocation` parameter entirely.
- `dateKey()` uses UTC: `new Date().toISOString().slice(0, 10)`.
- Web `src/screens/DailyChallengeScreen.tsx`: delete the `question.topic === "location"`
  render branch and the `WorldMap` lazy import (no longer reachable). Keep everything else.
- Web `src/screens/HomeScreen.tsx`: "resets in Xh" computes hours to next UTC midnight
  (`24 - new Date().getUTCHours()`); copy for un-played state becomes
  `"5 mixed questions · keeps your streak alive"` (use `DAILY_QUESTION_COUNT`, don't
  hardcode 5).
- Mobile `(tabs)/index.tsx`: `hoursToMidnight()` computes to next UTC midnight; remove the
  local `DAILY_COUNT` in `mobile/src/app/quiz.tsx` and use `DAILY_QUESTION_COUNT` from
  core (no more `.slice(0, 5)`).
- Web `daily` leaderboard note: past history entries with `total: 10` remain valid data;
  no migration needed.

### 4. Remove web lesson gating

- `src/App.tsx` `openLesson`: delete the "only next uncompleted lesson" guard — any lesson
  is openable (matches mobile). Keep `firstOpenLesson`/`nextLearningLesson` for the
  "continue" CTAs.
- `src/screens/PathsScreen.tsx` / `src/components/LessonNode.tsx`: ensure "upcoming"
  lessons are tappable (remove any disabled state tied to gating; keep the visual
  current/completed distinction).

### 5. Delete dead web components

- Delete `src/components/HeaderStats.tsx`, `src/components/LearningPath.tsx`,
  `src/components/ResultCard.tsx` (verified unimported).

## Test Plan

- `npm install` (workspace link), then `npm test` and `npm run build` at root.
- `cd mobile && npx tsc --noEmit`.
- Add a core unit test `packages/core/src/utils/__tests__/dailyChallenge.test.ts` update:
  daily quiz has exactly 5 questions, none with topic `location`, and two calls with the
  same dateKey produce identical question ids (determinism preserved).
- State in the summary: `grep -rn "from \"../utils/quiz\"" src mobile/src` (and the other
  moved modules) returns nothing; no duplicated file remains.

## Assumptions

- npm (not pnpm/yarn) workspaces; `mobile/` intentionally NOT a workspace member (it keeps
  its own lockfile; it reaches core via Metro alias only).
- No Expo config plugin changes needed; Metro `watchFolders` + `extraNodeModules` is
  sufficient for a source-level shared package.
- Reducing daily from 10→5 on web is an accepted product decision (pre-launch).

## Acceptance Criteria

- One copy of every game-logic module, imported as `@flaggo/core` by both apps.
- Web and mobile daily quiz for the same UTC date produce identical question sequences.
- Web lessons are freely openable; web builds and tests green; mobile type-checks green.
