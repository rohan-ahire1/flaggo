# Uplift Phase 5 — Competitive Loop: Guest Matches, Realtime, Trivia Boards, Sync Merge, Streak Reminders

## Summary

Make the social/competitive loop feel alive: guests can play a challenge before signing
in, match results update in realtime, trivia gets leaderboards, progress sync always
merges (no clobbering), leaderboard writes get server-side sanity bounds, web adopts
React Query for server state, and Android gets a streak-reminder local notification.

## Implementation Changes

### 1. Guest match play (web + mobile)

- Web `src/screens/MatchScreen.tsx`: remove the signed-out wall. Guests load the match and
  play immediately. In `finish()`: if signed in → existing submit path. If NOT signed in →
  persist a pending result `{ matchId, score, total, at }` to localStorage key
  `flaggo-pending-match`, then navigate to `/match/:id/result` passing state
  `{ guestScore: score, guestTotal: total }`.
- Web `MatchResultScreen`: when location state carries a guest score, show it as a local
  row "You (not saved) — score/total" above the fetched rows, plus a primary CTA "Sign in
  to save your score" → `openSignIn()`.
- Pending flush: in `GameProvider`, on auth state becoming signed-in, read
  `flaggo-pending-match`; if present and < 48 h old → `ensureName()` then
  `submitMatchResult(...)`, clear the key, toast "Challenge score saved".
- Mobile `mobile/src/app/quiz.tsx` (match mode): mirror the same behavior with AsyncStorage
  key `flaggo-pending-match` and flush in `AuthProvider` (or `_layout`) on sign-in. The
  silent `.catch(() => undefined)` submit is replaced by: signed-in → submit with error
  notice on failure; signed-out → store pending + pass `my` score param (existing).
  `mobile/src/app/match/[id].tsx`: show the unsaved-score row + "Sign in to save" button
  (→ `/profile`) when a pending entry exists for this match.

### 2. Realtime match results (web + mobile)

- New migration `supabase/migrations/202607050002_realtime_and_bounds.sql` (also appended
  to `supabase/setup.sql`, idempotent):
  - `alter publication supabase_realtime add table public.match_results;` guarded with a
    DO block checking `pg_publication_tables` so re-runs don't error.
  - Score bounds trigger (see §4) in the same file.
- Web `MatchResultScreen` + mobile `match/[id].tsx`: subscribe
  `supabase.channel(\`match-\${id}\`).on("postgres_changes", { event: "*", schema:
  "public", table: "match_results", filter: \`match_id=eq.\${id}\` }, refetch)`. Cleanup
  `removeChannel` on unmount. Fallback: if channel status is not `SUBSCRIBED` within 5 s,
  start a 10 s `setInterval` refetch (cleared on unmount / on successful subscribe).
  "Waiting for another player." copy gains a subtle live indicator (pulsing dot) while
  subscribed.

### 3. Trivia leaderboards

- Core `game/boards.ts`: add `triviaBoard(mode: TriviaMode) => \`trivia-\${mode}\``.
- Web `TriviaScreen.finish()`: after persisting local best, if signed in →
  `ensureName()` → `submitScore(triviaBoard(mode), best, name)` (same fire-and-forget
  pattern as arcade). Mobile `mobile/src/app/trivia.tsx`: same.
- Mobile `mobile/src/app/leaderboard.tsx`: add a third tab "Trivia" with mode chips
  (Higher/Lower, Odd one out, True/False) fetching `triviaBoard(mode)`. (Web tab exists
  from Phase 4.)

### 4. Leaderboard score bounds (server-side sanity)

- In `202607050002_realtime_and_bounds.sql`: `create or replace function
  public.validate_leaderboard_score() returns trigger` enforcing:
  - `board like 'daily-%'` → `new.score between 0 and 10`
  - `board like 'arcade-%'` or `board like 'trivia-%'` → `new.score between 0 and 1000`
  - `board = 'xp-alltime'` → `new.score between 0 and 5000000`
  - else → allow.
  Raise exception on violation. `create trigger` BEFORE INSERT OR UPDATE on
  `public.leaderboard_scores`. Add to `setup.sql` idempotently (`drop trigger if exists`).

### 5. Sync always merges (both apps)

- Web `src/hooks/useSyncedProgress.ts`: in the hydrate path, replace the
  `shouldMerge ? merge : serverNewer ? server : local` decision with unconditional
  `mergeProgress(local, serverProgress)` (mergeProgress already resolves per-field: max
  counters, union lessons, freshest review entries). Keep the anonymous-merge marker
  cleanup. Debounced saves unchanged.
- Mobile `mobile/src/state/ProgressProvider.tsx` (or its storage sync path): apply the
  same unconditional merge on hydrate.
- Add/extend a core test in `progressMerge` asserting: two divergent progresses (device A
  ahead in flags, device B ahead in capitals) merge without losing either side's boxes.

### 6. React Query on web (server-state parity with mobile)

- Add `@tanstack/react-query` to root deps. Create `src/lib/queryClient.ts` (defaults:
  `staleTime: 30_000`, `retry: 1`). Wrap in `AppShell` with `QueryClientProvider`.
- Convert to `useQuery`: `LeaderboardScreen` (key `["leaderboard", board]`),
  `FriendsScreen` (`["friends-leaderboard"]`), `MatchScreen` match+results load
  (`["match", id]`), `MatchResultScreen` (`["match-results", id]`, invalidated by the
  realtime callback via `queryClient.invalidateQueries`). Preserve existing error UI.

### 7. Streak reminder notification (Android/iOS native only)

- Add `expo-notifications` dependency + plugin entry in `mobile/app.json`.
- New `mobile/src/lib/streakReminder.ts`:
  - `setStreakReminderEnabled(on: boolean)` / `isStreakReminderEnabled()` persisted via
    AsyncStorage key `flaggo-streak-reminder`.
  - `syncStreakReminder(progress)`: no-op on web (`Platform.OS === "web"`). When enabled:
    request permissions (if denied → disable + return false); cancel all scheduled
    notifications; if today's daily is NOT done → schedule one calendar notification at
    19:00 local today (skip if already past 19:00 — schedule tomorrow 19:00 instead);
    else schedule tomorrow 19:00. Content: title "Keep your {streak}-day streak" (or
    "Today's Five is ready" when streak = 0), body "Play today's Five before midnight."
    Android: create channel `streak` (default importance) once.
- Wire-up: call `syncStreakReminder(progress)` after daily completion (`quiz.tsx`
  `finish()` daily branch) and on app foreground (`AppState` listener in `_layout.tsx`).
- `mobile/src/app/(tabs)/profile.tsx`: new "Reminders" section with a switch row
  "Daily streak reminder — 7 pm" toggling `setStreakReminderEnabled` + immediate
  `syncStreakReminder`. Default OFF.

## Test Plan

- Web: `npm test`, `npm run build`. New tests: pending-match flush logic (pure helper —
  extract `readPendingMatch/writePendingMatch/clearPendingMatch` into
  `src/lib/pendingMatch.ts` and unit test expiry), progressMerge divergence test (core).
- Mobile: `npx tsc --noEmit`.
- SQL: state in the summary that `setup.sql` was re-run-safe (idempotent guards present).
- Manual walkthrough in summary: guest opens `/match/:id`, plays, sees unsaved row,
  signs in, score appears; second browser adds a result and the first updates without
  refresh (or via 10 s poll fallback).

## Assumptions

- Supabase project has Realtime available (free tier does); if the publication ALTER is
  rejected in some environment, the poll fallback still delivers the feature.
- Notification precise-alarm restrictions on Android 14+: calendar-trigger local
  notifications via expo-notifications are acceptable (no exact-alarm permission chase).
- expo-notifications requires a development build (already true for this app — sqlite,
  reanimated). No push infrastructure — local only.

## Acceptance Criteria

- A signed-out recipient can complete a challenge round end-to-end and later save it.
- Match result screens update live (or ≤10 s) when the opponent finishes.
- Trivia boards receive scores from both platforms and render on both leaderboards.
- Two-device divergent progress merges losslessly (test proves it).
- Absurd leaderboard writes (e.g. daily score 5000) are rejected by the database.
