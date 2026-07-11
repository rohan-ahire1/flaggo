# Uplift Phase 1 — Trust & Honesty Fixes (web + mobile)

## Summary

Remove every piece of fake or misleading data/behavior, fix the mobile spaced-repetition
data-corruption bug, make mobile arcade modes actually enforce their advertised rules,
submit mobile scores to the shared leaderboards, share challenge links as https URLs,
replace the `window.prompt` display-name flow on web with a styled dialog, and stop the
"Progress saved" toast spam. No visual redesign in this phase — keep each screen's current
styling conventions.

## Implementation Changes

### Web

1. **Remove fake friends row** — `src/screens/HomeScreen.tsx`
   - Delete the hardcoded `["Mia", "Leo", "Ada"]` avatar row and the `Friends` header with
     "See all" (lines ~170–193).
   - Replace the whole section with a single full-width card (same visual pattern as the
     existing "Challenge a friend" card): icon `trophy` in a `bg-accent`-style square,
     title "Friends & leaderboards", subtitle "Play a challenge to build your friends list",
     chevron; `onClick={onOpenFriends}`.

2. **Kill "Progress saved" toast spam** — `src/App.tsx`
   - In the `syncState`/`syncError` effect (lines ~86–97), delete the `syncState === "saved"`
     branch entirely. Keep the `syncError` branch ("Sync needs attention").

3. **Replace `window.prompt` name flow with a styled dialog**
   - New file `src/components/NameClaimDialog.tsx`: a modal styled like `SignInModal`
     (fixed overlay, centered card, `animate-pop-in`). Contents: title "Claim your player
     name", subtitle "Shown on leaderboards and challenges", one text input
     (`maxLength 20`, `autoComplete="username"`, placeholder "flag_explorer"), live
     availability feedback reusing `isValidUsername` and `checkUsernameAvailable` from
     `src/lib/username.ts` with the same 400 ms debounce pattern as `SignInModal`, a
     primary "Save name" button (disabled while checking/unavailable/empty) and a
     text-button "Not now".
   - New file `src/components/NameClaimProvider.tsx`: React context exposing
     `ensureName(): Promise<string | null>`. It renders `NameClaimDialog`. Behavior of
     `ensureName`: if no signed-in user → resolve `null`; if `displayName` from `useAuth()`
     is already non-empty → resolve it; otherwise open the dialog and resolve with the
     saved name or `null` on dismiss. On save it calls `updateDisplayName(user.id, value)`
     from `src/lib/leaderboard.ts` and `setDisplayName` from `useAuth()`.
   - Mount the provider in `src/AppShell.tsx` inside `AuthProvider` so all screens can use it.
   - Replace the three local `ensureName()` implementations that call `window.prompt`
     with `const { ensureName } = useNameClaim()`:
     `src/screens/DailyChallengeScreen.tsx` (~line 60), `src/screens/ArcadeScreen.tsx`
     (~line 100), `src/screens/MatchScreen.tsx` (~line 73). Delete the now-unused
     `window.prompt` code paths.

### Mobile

4. **Fix review_items schema (data corruption)** — composite key `(country_code, topic)`
   - `mobile/src/db/schema.ts`: make `topic` `text("topic").notNull().default("flag")` and
     define a composite primary key on `(countryCode, topic)` using drizzle's
     `primaryKey({ columns: [...] })` in the table's third argument. Remove `.primaryKey()`
     from `countryCode`.
   - `mobile/src/db/bootstrap.ts`: update `SCHEMA_SQL`'s `CREATE TABLE IF NOT EXISTS
     review_items` to `country_code TEXT NOT NULL, topic TEXT NOT NULL DEFAULT 'flag', …,
     PRIMARY KEY (country_code, topic)`. Add a migration step inside `bootstrapDbSync` /
     `bootstrapDbAsync` that runs BEFORE the schema SQL: inspect
     `PRAGMA table_info(review_items)`; if the table exists and the `topic` column has
     `pk = 0` (old single-column PK), then:
     `CREATE TABLE review_items_new (…new shape…)`;
     `INSERT OR REPLACE INTO review_items_new SELECT country_code, COALESCE(topic,'flag'),
     box, correct_count, wrong_count, last_seen_at, next_review_at FROM review_items;`
     `DROP TABLE review_items; ALTER TABLE review_items_new RENAME TO review_items;`
     Wrap in a transaction. Factor the shared SQL into a helper so sync and async paths
     use identical statements.
   - `mobile/src/utils/storage.ts`:
     - `readReview()`: key the map with `reviewKey(r.countryCode, (r.topic ?? "flag") as Topic)`
       (import `reviewKey` from `../types/topic`) instead of `map[r.countryCode]`.
     - `writeRow()`: insert `topic: r.topic ?? "flag"`.

5. **Enforce arcade mode rules in the quiz** — `mobile/src/app/quiz.tsx`
   - Add mode semantics for `isArcade`:
     - `timed`: 60-second countdown; `hard`: 45-second countdown. Compute remaining from a
       start timestamp (`Date.now()`), ticking state every 250 ms — do NOT accumulate
       `elapsed + 1` (drift). When remaining hits 0: if a question is revealed, finish on
       next tick; otherwise call `finish()` immediately. Replace the elapsed `Pill` with a
       countdown `Pill` (icon `clock`, label `m:ss`) for these modes. Non-arcade modes keep
       the existing count-up pill.
     - `sudden`: no countdown. After a wrong answer is revealed, the footer button label
       becomes "See results" and `next()` calls `finish()` regardless of remaining questions.
   - Under the "Question X of Y" row, when `isArcade`, render a one-line rules hint:
     timed → "60s on the clock", hard → "45s · lookalike flags", sudden → "One wrong answer
     ends the run". For arcade, hide "of Y" (endless framing): show "Question X".
   - Arcade needs more than the default question count for timed runs: in
     `mobile/src/quiz/buildQuestions.ts`, make `buildArcadeQuestions` generate at least 60
     questions (loop `generateReviewQuestions` over reshuffled pools until 60 collected,
     same approach as web's `ArcadeScreen` slicing).
   - `finish()` for arcade already persists best via `persistArcadeBest` — keep.

6. **Submit mobile scores to leaderboards**
   - New file `mobile/src/components/NameClaimDialog.tsx`: RN modal (use `Modal` from
     react-native, transparent backdrop, centered `Card`) with the same content/behavior as
     the web dialog in item 3, using existing `ui.tsx` primitives (`Card`, `PillButton`,
     `SectionLabel`) and `updateDisplayName` from `mobile/src/lib/leaderboard.ts`.
     Username validation: port `isValidUsername` regex from web `src/lib/username.ts` into
     `mobile/src/lib/username.ts` (availability check optional on mobile — skip the
     Supabase availability query; validate format only).
   - New file `mobile/src/components/NameClaimProvider.tsx` mirroring the web provider
     (context + `ensureName(): Promise<string | null>`), mounted in
     `mobile/src/app/_layout.tsx` inside `AuthProvider`.
   - `mobile/src/app/quiz.tsx` `finish()`:
     - daily: if signed in → `const name = await ensureName(); if (name) void
       submitScore(dailyBoard(dateKey()), score, name)` (imports from
       `mobile/src/lib/leaderboard.ts`, `dateKey` already imported).
     - arcade: same pattern with `arcadeBoard(arcadeMode, topic)` and the persisted best
       (`Math.max(previous best, score)`).
     - Submission is fire-and-forget with `.catch(() => undefined)`; do not block the
       results screen.
   - Results screen caption: when finishing daily/arcade signed-out, append a results
     action `{ label: "Sign in to compete", variant: "secondary", onPress: () =>
     router.replace("/profile") }` before "Done".
   - XP board parity: in `mobile/src/state/ProgressProvider.tsx`, add an effect that, when
     signed in AND `displayName` is non-empty AND `progress.xp > 0`, debounces 5 s and calls
     `submitScore(xpBoard(), progress.xp, displayName)`. Guard against resubmitting the
     same xp value twice in a row (ref of last submitted value).

7. **Remove fake "12,438 playing today"** — `mobile/src/app/(tabs)/index.tsx` (~line 117)
   - Replace the un-played branch text with: `"Same 5 questions for everyone today"`.
     Keep the played branch ("You scored X/Y today") as is.

8. **Share https challenge links** — `mobile/src/social/challenge.ts`
   - Replace `matchDeepLink` usage in `shareChallenge` with a web URL:
     `const webUrl = \`${env.siteUrl}/?m=${match.id}\`` (import `env` from `@/config/env`).
     Message: `` `${scoreLine}Can you beat me on this Flaggo round? ${webUrl}` ``.
     Native `Share.share` and web share/copy paths all use `webUrl`. Keep `matchDeepLink`
     exported (still used for in-app deep-link parsing).
   - `mobile/src/app/_layout.tsx`: in the deep-link effect, before delegating to
     `createSessionFromUrl`, parse the incoming URL; if it contains a query param `m`
     (e.g. an https link `…?m=<id>` opened in the app), `router.push({ pathname:
     "/match/[id]", params: { id } })` and skip auth handling for that URL.

## Test Plan

- Web: `npm test` and `npm run build` must pass.
- Mobile: `cd mobile && npx tsc --noEmit` must pass.
- Manual assertions to state in the final summary (code-level walkthrough is fine):
  - No occurrence of `window.prompt` remains in `src/`.
  - `grep -rn "Mia" src/` and `grep -rn "12,438" mobile/src/` return nothing.
  - The migration path: simulate old DB (single-PK table with a NULL-topic row) → after
    bootstrap, row exists with topic `flag` and composite PK table shape.

## Assumptions

- Supabase env may be absent locally; all submit/name flows must no-op gracefully exactly
  like existing `supabase == null` guards.
- No visual redesign: reuse each platform's current component idioms.
- Do not touch `DAILY_QUESTION_COUNT` or daily seeding in this phase (Phase 2 handles it).

## Acceptance Criteria

- Zero fabricated data rendered anywhere in either app.
- Mobile arcade: timed/hard end by countdown; sudden ends after first miss.
- Mobile daily/arcade scores appear on the same boards the web reads (given Supabase env).
- Same-country/different-topic review states persist independently on mobile across restarts.
- Shared challenge message contains an `https://…?m=` link, not a `flaggo://` link.
