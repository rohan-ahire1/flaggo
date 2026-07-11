# Uplift Phase 7 — Achievements (badges)

## Summary

Add an achievements system: six launch badges, computed from progress in shared core
logic, persisted in the progress blob (no DB migration), surfaced on both platforms in
Profile (badge grid with locked/earned states) and celebrated on RoundResults when a
round earns one.

## Badge definitions (exact)

| id | Name | Icon (existing set) | Earned when |
|---|---|---|---|
| `europe-explorer` | Europe Explorer | `globe` | every Europe-region lesson in the Flags path is in `completedLessonIds` |
| `capital-rookie` | Capital Rookie | `pin` (web) / `map-pin` (mobile) | first Capitals-path lesson completed |
| `flag-streak-7` | Flag Streak 7 | `flame` | `progress.daily.streak >= 7` |
| `africa-master` | Africa Master | `star` | ≥ 20 African countries mastered in the flag topic (SRS box ≥ 5) |
| `perfect-round` | Perfect Round | `check` | any completed round with `total >= 5` and `score === total` |
| `lookalike-survivor` | Similar Flags Survivor | `target` | an Arcade **hard**-mode run finishes with score ≥ 10 (any topic) |

Locked-state hint copy (shown under the name when unearned), one line each:
"Finish every Europe flags lesson" / "Complete your first capitals lesson" /
"Keep a 7-day daily streak" / "Master 20 African countries" /
"Score 100% in a round of 5+" / "Score 10+ in a Hard arcade run".

## Implementation Changes

### 1. Core (`packages/core`)

- `types/progress.ts`: add `badges: { id: string; earnedAt: string }[]` to `AppProgress`
  and `defaultProgress` (`[]`). Update `normalizeProgress` in `utils/progressMerge.ts`
  to sanitize the array (drop malformed entries, dedupe by id keeping earliest
  `earnedAt`). `mergeProgress`: union both sides' badges by id, keeping the earliest
  `earnedAt` (badges are never revoked).
- New `game/badges.ts`:
  - `BADGES`: ordered metadata array `{ id, name, hint, icon }` (icon as a string key;
    each app maps it to its own Icon component names).
  - `RoundContext = { score: number; total: number; kind: "lesson" | "review" | "daily"
    | "arcade" | "trivia" | "test" | "map" | "match"; arcadeMode?: ArcadeMode }`.
  - `evaluateBadges(progress, countries, lessons, round?: RoundContext): string[]` —
    pure; returns ids newly earned (i.e. criterion met AND not already in
    `progress.badges`). Criteria exactly per the table; `perfect-round` and
    `lookalike-survivor` require the `round` argument.
  - `awardBadges(progress, ids, now = new Date())`: returns progress with the new
    badges appended (`earnedAt` ISO string).
- Export from the core barrel.
- Tests `game/__tests__/badges.test.ts`: one case per badge (earned/not-earned edge),
  plus: already-earned ids are not returned again; merge keeps earliest earnedAt.

### 2. Award points (both apps — same rule)

At every round-finish site, after the final progress object is built, run:
`const newIds = evaluateBadges(next, countries, lessons, roundCtx); if (newIds.length)
next = awardBadges(next, newIds);` and pass the earned ids into the results UI.

- Web: `LessonScreen` (lesson + review finishes), `DailyChallengeScreen`,
  `ArcadeScreen` (kind "arcade" with `arcadeMode`), `TriviaScreen`, `FlagTestScreen`
  (kind "test"), `MapPlayScreen` (kind "map"), `MatchScreen` (kind "match", before
  submit/navigate; earned ids ride to the result screen via location state).
  Lessons come from `useGame()`; where a screen lacks `lessons`, pass `[]` only if the
  lesson-based badges cannot apply — otherwise thread `lessons` through (preferred:
  always pass real `lessons` from GameProvider).
- Mobile: `mobile/src/app/quiz.tsx` `finish()` (covers daily/arcade/lesson/match with
  the right `kind`), `mobile/src/app/trivia.tsx`, `mobile/src/app/test.tsx`,
  `mobile/src/app/map/play.tsx`. Lessons via the existing `generateLessons(countries)`
  memo already present in the app (import from core).

### 3. RoundResults celebration (both apps)

- Web `src/components/RoundResults.tsx` and mobile
  `mobile/src/components/RoundResults.tsx`: new optional prop
  `earnedBadges?: { id: string; name: string; icon: ... }[]`. When non-empty, render a
  card above the review list: accent-toned, trophy icon, "Badge earned!" label and the
  badge name(s) (comma-joined when several). Reuse existing card idioms; no new
  animation system (web may reuse `animate-pop-in`; mobile the existing entering
  animations).

### 4. Profile badge grid (both apps)

- Web `src/screens/ProfileScreen.tsx`: new "Achievements" section (after stats): grid
  (3 columns mobile, 6 on md) of all `BADGES` in order. Earned: filled icon tile
  (`bg-primary/10 text-primary` tile, name in ink, `earnedAt` date short-formatted
  beneath). Locked: `bg-surface text-muted` tile at 60% opacity, name muted, hint copy
  in place of the date. Include a small counter in the section header: "3 of 6".
- Mobile `mobile/src/app/(tabs)/profile.tsx`: same section using `Card`/`SectionLabel`
  idioms, 3-column wrap.

### 5. Docs

- Append a short "Achievements" paragraph to `docs/ARCHITECTURE.md` §3 (evaluation is
  pure in core; stored in the progress blob; never revoked; merge = union earliest).

## Test Plan

- `npm test` (root — includes new core badge tests), `npm run build`.
- `cd mobile && npx tsc --noEmit`.
- State in the summary a code walkthrough of one award path per platform (e.g. web
  daily perfect 5/5 awards `perfect-round` and shows the RoundResults card; mobile
  arcade hard ≥10 awards `lookalike-survivor`).

## Assumptions

- No server/schema change: badges live inside the existing `progress.data` JSONB blob.
- Older synced blobs without `badges` normalize to `[]` (handled in normalizeProgress).
- Badge icons reuse the existing Icon sets; no new art assets.

## Acceptance Criteria

- All six badges earnable exactly per the criteria table; already-earned never
  re-awarded or revoked; cross-device merge unions badges.
- Profile shows a 6-badge grid with locked hints and earned dates on both platforms.
- Earning a badge during a round shows the celebration card on that round's results.
