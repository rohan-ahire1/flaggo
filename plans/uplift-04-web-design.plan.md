# Uplift Phase 4 — Web: Design-System Completion + Screen UX Overhaul

## Summary

Finish the token migration on all legacy web screens (single design language matching the
Home/Welcome "cartographic" generation), port mobile's RoundResults as the one completion
screen, overhaul the leaderboard, sign-in, dialogs, custom test, Home IA, welcome copy,
keyboard support and a11y. After this phase the `flaggo-*` Tailwind aliases are deleted.

## Implementation Changes

### 1. Token migration (all remaining legacy screens)

Screens: `LessonScreen`, `LessonCompleteScreen` (replaced, see §3), `DailyChallengeScreen`,
`ArcadeScreen`, `TriviaScreen`, `FlagTestScreen`, `TestSetupScreen`, `MapMenuScreen`,
`MapPlayScreen`, `ExploreMapScreen`, `LeaderboardScreen`, `FriendsScreen`, `PathsScreen`,
`DecksScreen`, `FlagsLibraryScreen`, `StatsScreen`, `ProfileScreen`, plus components
`QuestionCard`, `AnswerOption`, `FeedbackPanel`, `FlagCard`, `ProgressBar`, `Toast`,
`SignInModal`, `StatCard`, `LessonNode`, `AppFooter`, `WorldMap` (chrome only — keep its
fixed ocean palette).

Mechanical rules:
- `text-flaggo-muted`→`text-muted`, `text-flaggo-text`→`text-ink`, `bg-flaggo-bg`→`bg-paper`,
  `border-flaggo-border`→`border-line`, `bg-flaggo-green|blue`→`bg-primary`,
  `text-flaggo-green|blue`→`text-primary`, `flaggo-red`→`error`, `flaggo-yellow|orange`→
  `accent`, `green-grad|blue-grad`→`bg-primary` (drop gradient), `shadow-button-green|blue`
  →`shadow-button`, `shadow-button-red`→`shadow-[0_5px_0_rgb(var(--error))]` (add a
  `shadow-button-error` token in tailwind.config instead of arbitrary values).
- Literal grays: `bg-white`→`bg-paper` (cards on `bg-surface` sections) — where a card
  needs elevation against paper, use `bg-paper` + `border-line` + `shadow-card`, matching
  Home's cards; `border-slate-200`→`border-line`; `bg-slate-100|50`→`bg-surface`;
  `shadow-[0_8px_0_#e5e7eb]`→`shadow-card`; `bg-slate-900/40` overlay→`bg-ink/40`.
- Typography scale (apply everywhere): screen titles keep `.screen-title`;
  section headers `font-display text-xl font-semibold`; card titles `text-[17px]
  font-semibold`; `font-black`/`font-extrabold` downgrade to `font-semibold` or
  `font-bold` — the only remaining `font-black` is large numerals (scores, countdowns).
- After migration: delete the whole `flaggo` color alias block, `green-grad`/`blue-grad`/
  `accent-grad` backgroundImage entries, and `shadow-button-green|blue` from
  `tailwind.config.js`; delete `.flaggo-button`, `.flaggo-card` from `index.css` (replace
  usages with `btn-primary`/semantic classes). CI check: `grep -rn "flaggo-" src/` must
  return zero styling hits (BRAND strings excluded).
- `LessonCompleteScreen` confetti array → `["rgb(var(--primary))", "rgb(var(--accent))",
  "rgb(var(--success))", "rgb(var(--error))", "rgb(var(--primary-dark))",
  "rgb(var(--muted))"]` (carried into the new RoundResults, §3).

### 2. Shared dialog components

- `src/components/ConfirmDialog.tsx`: styled modal (same shell as NameClaimDialog):
  title, body, destructive-or-primary confirm button, cancel. Promise-based helper via a
  `ConfirmProvider` (`useConfirm(): (opts) => Promise<boolean>`) mounted in `AppShell`.
  Focus trap: focus the cancel button on open, `Tab` cycles within, `Escape` and backdrop
  click resolve `false`, restore focus on close.
- Replace every `window.confirm`: Profile reset progress, App/GameProvider
  `deleteAccount`, Decks `removeDeck` ("Delete this deck?"), and add round-exit
  confirmation (§5).
- Apply the same focus-trap/Escape/backdrop behavior to `SignInModal` and
  `NameClaimDialog`.

### 3. RoundResults port — one completion screen for every mode

- `src/components/ScoreRing.tsx`: SVG ring (radius ~56, stroke 10) showing
  `score/total`, animated stroke-dashoffset on mount, caption line below.
- `src/components/RoundResults.tsx`: port of `mobile/src/components/RoundResults.tsx` in
  web idioms: "Round complete" label, title (Perfect round!/Great round!/Keep practising!),
  ScoreRing with caption, optional streak card, "N to review next" card, scrollable
  per-question review list (flag thumb, question label, ✓/✗, "You: X" / "Answer: Y"),
  pinned action buttons (label/variant/icon/onPress array). Confetti burst overlay when
  `score === total` (reuse the animate-confetti keyframes, themed colors).
- Every round flow accumulates `RoundResultItem[]` as answers happen (label via
  `answerLabel` from core; chosen label for wrong answers; countryCode/countryName;
  context line "subregion · Capital: X"):
  - `LessonScreen` (lesson + review modes) → replaces `LessonCompleteScreen` route:
    actions = [Continue learning (primary, only when a next lesson exists), Play again?
    no — Back to Today (secondary)]. Delete `LessonCompleteScreen.tsx` and the
    `/complete` route; LessonScreen renders `RoundResults` in-place when finished (same
    pattern as mobile quiz.tsx). Keep awarding xp/coins/streak exactly as today.
  - `DailyChallengeScreen` → actions: Challenge a friend (primary), See leaderboard,
    Done. Caption `+{xp} XP · streak {n}`.
  - `ArcadeScreen` → replaces the green "You scored" card: actions: Play again (primary,
    restarts same mode/topic), Challenge a friend, View leaderboard, Done.
  - `TriviaScreen` → actions: Play again (primary), Done.
  - `FlagTestScreen` → NEW summary (currently none): actions: Practice missed (primary,
    only when misses exist → `startReview(missedCountries, topic)`), Back to Practice.
  - `MapPlayScreen` → replaces `onComplete`→complete-screen flow with in-place
    RoundResults: actions: Play again, Back to map menu.
  - `MatchScreen` → after submit succeeds keep navigating to `/match/:id/result` (that
    screen already compares players) but pass the items via state so MatchResult can show
    a "Your round" collapsible review list under the standings.

### 4. QuestionCard / FeedbackPanel / keyboard / a11y

- `FeedbackPanel`: width follows the shell (`max-w-md md:max-w-2xl lg:max-w-3xl`);
  container gets `role="status" aria-live="polite"`; the Continue button autofocuses on
  mount; `Enter` triggers Continue (window keydown while panel open).
- `TriviaScreen`: delete its inline duplicate feedback section; use `FeedbackPanel`
  (xp=0, answerLabel from round).
- Keyboard answers: in `QuestionCard`/`TriviaCard`, number keys 1–4 activate the visible
  options in DOM order (window keydown listener active while `!disabled`; skip when a
  dialog is open — check `document.querySelector('[role="dialog"]')` or a shared "modal
  open" context flag).
- Home hero nested-button fix (`src/screens/HomeScreen.tsx`): restructure the hero as a
  `<div>` card containing ONE `<button>` for the whole-card action and a separate real
  `<button>` for the inner CTA (no `role="button"` spans, no nesting).
- Library "Explore" pseudo-tab (`FlagsLibraryScreen`): keep the two-segment control but
  make the Explore segment visually consistent (it navigates; add a small `↗` chevron
  icon to signal navigation).

### 5. Round-exit confirmation

- In `LessonScreen`, `DailyChallengeScreen`, `ArcadeScreen`, `TriviaScreen`,
  `FlagTestScreen`, `MapPlayScreen`: the close (X) button, when at least one question has
  been answered and the round is not finished, calls
  `useConfirm()({ title: "End this round?", body: "Answered questions are already
  counted.", confirmLabel: "End round", destructive: true })` before exiting.

### 6. SignInModal overhaul

- Add "Forgot password?" link (visible in sign-in mode): swaps the card to a reset form
  (email input + "Send reset link") calling `supabase.auth.resetPasswordForEmail(email,
  { redirectTo: `${SITE_URL}/auth/callback?type=recovery` })`; success shows "Check your
  email".
- `src/pages/AuthCallbackPage.tsx`: when the callback URL contains `type=recovery` (query
  or hash), render a "Set a new password" form (password + confirm, min 6) calling
  `supabase.auth.updateUser({ password })`, then navigate `/` with a success toast.
- Password fields get a show/hide toggle button (`aria-label="Show password"`).
- On successful sign-in/signup: close the modal automatically and fire the toast
  ("Signed in" / "Account created"); remove the in-modal status text for the success path
  (keep it for errors).

### 7. Leaderboard redesign — `src/screens/LeaderboardScreen.tsx`

- Replace the `<select>` with: segmented tabs `[Today] [Arcade] [Trivia] [XP]`.
  - Arcade tab reveals two chip rows: mode (Timed / Sudden death / Hard) and topic
    (Flags / Capitals / Location / Currency / Language / Neighbours) → board
    `arcadeBoard(mode, topic)`.
  - Trivia tab: mode chips (Higher/Lower, Odd one out, True/False) → `trivia-<mode>`
    boards (submission ships in Phase 5; empty boards until then are fine).
  - Humanized heading under the tabs, e.g. "Sudden death · Capitals".
- Rows: top-3 ranks get medal styling (accent ring on the rank number); `is_me` row keeps
  the highlighted style.
- Pinned "you" row: when signed in and the user is not in the fetched top rows, query the
  user's own score (`leaderboard_scores` select for `user_id = auth.uid()` + board) and
  compute rank via a count query (`score > mine`); render it pinned under the list as
  `#rank · you · score`. Skip silently when absent.
- Empty state: trophy icon, "No scores yet", subtitle "Finish today's round to claim the
  first spot", CTA button → `/daily`.

### 8. Empty states (same card pattern: icon, title, one-line sub, CTA)

- Friends: "No friends yet" / "Send a challenge — anyone who plays it joins your list" /
  CTA "Create a challenge" (`createAndShareChallenge`).
- Decks (no decks for topic): "Build your first deck" / CTA scrolls to Quick builders.
- Library (no filter matches): existing message + "Clear filters" button.

### 9. Home IA + Welcome copy (align with the daily-duel positioning)

- `HomeScreen` new order: 1) header (Today + date + streak pill); 2) Daily hero
  (bg-primary card, "TODAY'S FIVE" label, 5 progress pips from today's result, CTA
  "Play today's Five" / "Play again", "resets in Xh" chip — port of the mobile hero);
  3) Next-best-action card (port of mobile "Progress pulse": Start review with due count /
  Practice weak spots / Continue learning `nextLesson.title` when nothing due — one
  primary CTA + mastery % tile); 4) Challenge-a-friend row card; 5) "Quick play" 2×2 grid
  (Learn, Find on map, Arcade, Trivia); 6) "More" grid (Leaderboard, Flag library, Decks,
  Stats, Friends & leaderboards card from Phase 1 folds in here as a Friends tile).
- `WelcomeScreen`: tagline → "Geography, but make it a daily duel"; body → "A fresh
  5-question challenge every day. Same for everyone. Beat your friends."; primary CTA →
  "Play today's challenge" (→ `/daily`); secondary text button → "Start with a lesson"
  (→ startLearning("flag")); keep "no sign-up · about 90 seconds".

### 10. Install prompt

- In `AppShell`/`AppLayout`: listen for `beforeinstallprompt`, `preventDefault()`, stash
  the event in state (context). `ProfileScreen` install card: when the stashed prompt
  exists → primary button "Install app" that calls `prompt()` and clears on
  `userChoice`; when running standalone (`matchMedia('(display-mode: standalone)')`) →
  show "Installed ✓" text; otherwise keep current hint copy.

### 11. Web arcade/trivia timer semantics

- Timed = 60 s, Hard = 45 s: countdown computed from a start timestamp (drift-free,
  250 ms tick), red pill turns pulsing when ≤ 10 s (`animate-pulse`).
- Sudden death: NO timer pill; run ends on first miss (existing) or question exhaustion.
- Remove the dead `mode === "hard" ? 60 : 60` branch.

## Test Plan

- `npm test`, `npm run build` green; update snapshots/tests touched by renames.
- Add component test for RoundResults (renders items, actions fire) and ConfirmDialog
  (Escape resolves false, confirm resolves true) using Testing Library.
- Summary must include: `grep -c "flaggo-" src/**` styling hits = 0; `grep -rn
  "window.confirm" src/` = 0.

## Assumptions

- Phases 1–3 are merged (NameClaimDialog, core package, routes exist).
- Dropping the green/blue color coding in favor of primary/accent/success/error is the
  intended visual direction (matches Home/mobile).

## Acceptance Criteria

- Switching any of the 4 palettes re-themes every screen with no stray white/slate/
  Duolingo-green artifacts.
- Every game mode ends on the same RoundResults screen with a per-question review list.
- Desktop: answer with 1–4 keys, continue with Enter, close dialogs with Escape.
- Leaderboard usable without a native `<select>`; own rank visible when off-list.
