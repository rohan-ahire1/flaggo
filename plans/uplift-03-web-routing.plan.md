# Uplift Phase 3 — Web: Real Routing (kill the screen state machine)

## Summary

Replace `App.tsx`'s 22-value `screen` union with real react-router routes so the browser
back button, deep links, and per-screen code-splitting work. Introduce a `GameProvider`
context to replace prop drilling. Add a proper Challenge tab screen (mirroring mobile).
No visual redesign; screens keep their current markup.

## Implementation Changes

### 1. Route map (all under the existing `BrowserRouter` in `AppShell.tsx`)

| Path | Screen | Notes |
|---|---|---|
| `/` | HomeScreen | Today tab |
| `/welcome` | WelcomeScreen | redirect target for brand-new users |
| `/learn` | PathsScreen | region list; `/learn/:region` for the lesson list |
| `/lesson` | LessonScreen | requires nav state; guard → redirect `/learn` |
| `/review` | ReviewScreen | Play tab |
| `/test-setup` | TestSetupScreen | |
| `/test` | FlagTestScreen | requires nav state; guard → `/test-setup` |
| `/daily` | DailyChallengeScreen | |
| `/arcade` | ArcadeScreen | |
| `/trivia` | TriviaScreen | |
| `/map` | MapMenuScreen | |
| `/map/play` | MapPlayScreen | requires nav state; guard → `/map` |
| `/map/explore` | ExploreMapScreen | back = `navigate(-1)` |
| `/decks` | DecksScreen | |
| `/library` | FlagsLibraryScreen | |
| `/leaderboard` | LeaderboardScreen | |
| `/friends` | FriendsScreen | |
| `/challenge` | ChallengeScreen (NEW) | Challenge tab |
| `/stats` | StatsScreen | |
| `/profile` | ProfileScreen | You tab |
| `/match/:id` | MatchScreen | shareable deep link |
| `/match/:id/result` | MatchResultScreen | |
| `/complete` | LessonCompleteScreen | requires nav state; guard → `/` |

- Legacy `?m=<id>` links MUST keep working: in the layout component, on mount, if
  `searchParams.get("m")` exists → `navigate(\`/match/${id}\`, { replace: true })`.
- Keep `/privacy`, `/terms`, `/auth/callback`, `*` routes as they are.

### 2. Layout + navigation

- New `src/AppLayout.tsx`: renders the outer shell currently in `App.tsx` (Toast,
  SignInModal, AdConsentBanner, the max-w container, `<Outlet />`, `AppFooter`,
  `BottomNav`). Nav/footer visibility: hide on the same screens as today — welcome,
  lesson, complete, test, map/play, daily, arcade, trivia, match, match result. Determine
  via a path-prefix list, not per-screen flags.
- `src/components/BottomNav.tsx`: tabs become `NavLink`s → Today `/`, Play `/review`,
  Challenge `/challenge`, Learn `/learn`, You `/profile`. Active state from route match
  (exact for `/`). Remove the `Screen`-typed props.
- Welcome redirect: in `AppLayout`, replicate the current "fresh profile → welcome" check
  (`xp || completedLessonIds.length || review keys` from loaded progress) but as a
  one-time redirect to `/welcome` when the user lands on `/` with no progress.
- Lazy-load the same screens that are lazy today via `React.lazy` per route.

### 3. GameProvider (replaces prop drilling)

- New `src/state/GameProvider.tsx` exposing via `useGame()`:
  - `progress`, `setProgress`, `resetAllProgress`, `syncState`, `syncError` (from
    `useSyncedProgress` — the hook moves here; `App.tsx` is deleted).
  - `lessons` (memoized `generateLessons(countries)`), `countries`.
  - Actions (moved from `App.tsx`, navigation now via `useNavigate` inside the screens or
    returned helpers): `openLesson(lesson)` (no gating — Phase 2), `startLearning(topic)`,
    `switchTopic(topic)`, `startReview(group, topic)`, `startDeckPractice(deck)`,
    `startFlagTest(group, mode, topic)`, `startMapPractice(mode, group)`,
    `startMapReview()`, `createAndShareChallenge()`, `deleteAccount()`, `signOutUser()`,
    `openSignIn()` (controls SignInModal state which lives in the provider),
    `setToast(msg)`.
- Ephemeral round parameters (active lesson, review group/topic, test config, map
  mode/group, lesson result) travel via `navigate(path, { state })`. Each consuming screen
  reads `useLocation().state`, and redirects to its setup screen when state is missing
  (hard refresh case). Store only serializable ids/codes in state (e.g. country codes,
  lesson id) and rehydrate objects from `countries`/`lessons` in the screen.
- The XP-submit effect, `preloadFlags`, `app-open` tracking, and the sync-error toast
  effect move from `App.tsx` into `GameProvider`/`AppLayout` (same behavior).
- Delete `src/App.tsx` after migration; update `AppShell.tsx` to route to `AppLayout`.

### 4. New ChallengeScreen — `src/screens/ChallengeScreen.tsx`

Mirror `mobile/src/app/(tabs)/challenge.tsx` in web idioms (current web styling
conventions): header "Challenge" + "Same round, head to head."; primary hero card
(bg-primary) with flag icon, "Challenge a friend", subtitle "Send today's exact
5-question round. When you both finish, compare scores.", CTA "Create & share" calling
`createAndShareChallenge()`; "Standings" link rows → Friends (`/friends`) and Leaderboard
(`/leaderboard`); a "How it works" card with the same 3 steps as mobile.

### 5. Screen prop cleanup

- Every screen drops its `onBack`/`onOpen*` callback props in favor of `useNavigate()` /
  `useGame()`. Back buttons call `navigate(-1)` (except explicit close targets: lesson/
  daily/arcade/trivia close → `/`, test close → `/review`, map play exit → `/map`).
- `LessonCompleteScreen`: reads `result` from location state; "Continue learning" asks
  `useGame().openLesson(nextLearningLesson(topic))` or `/` fallback (same logic as today,
  relocated).

## Test Plan

- `npm test` and `npm run build` green.
- Update/add tests only where imports break; no new test surface required this phase.
- State in summary a manual walkthrough: deep-load `/leaderboard` (SPA fallback exists in
  netlify.toml), browser back from `/arcade` returns to `/`, `?m=abc` redirects to
  `/match/abc`, hard refresh on `/lesson` redirects to `/learn`.

## Assumptions

- `react-router-dom` v7 already installed; use data-less `<Routes>`/`<Route>` composition
  (no loader API) to keep the diff small.
- URL state for rounds is intentionally NOT shareable (location.state); only `/match/:id`
  and top-level screens are deep-linkable. Acceptable for this phase.

## Acceptance Criteria

- Browser back/forward navigates between screens; back from Home exits the app (normal).
- `/daily`, `/arcade`, `/leaderboard`, `/match/:id` all load directly from a cold URL.
- No `Screen` union / `setScreen` remains in the codebase.
- BottomNav has a working Challenge tab.
