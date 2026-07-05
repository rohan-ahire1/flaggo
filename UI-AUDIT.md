# Flaggo — Mobile Web UI Audit

Scope: web build (`mobile/dist`) served at `http://127.0.0.1:8099`, audited at **phone viewport 390×844** via Chrome DevTools MCP (device emulation) + source review. Default theme "Ocean & Atlas".

Legend — **[H]** broken/blocking · **[M]** works-but-wrong · **[L]** cosmetic nit.
Verification — **live** = reproduced in-browser this pass · **code** = found by source review (high confidence, not yet clicked) · **screenshot** = seen in a captured image.

---

## ✅ Fixed this session (rebuilt into `dist`)
- **[H] Reset-progress dead button** — `profile.tsx` now uses `window.confirm` on web (verified live: fires with correct message). Native keeps `Alert.alert`.
- **[M] `Animated.View` className drops** — moved layout classes onto inner plain `View`s (fade animation preserved): `QuestionCard.tsx:43` (quiz prompt spacing), `test.tsx:115` (test body spacing), `match/[id].tsx:66` (challenge header centering). *(trivia.tsx wrapper had a single child — no effect, left as-is.)*

## ✅ Fixed this session — round 2 (rebuilt + verified live)
- **[M–H] Figtree now applies on web** — root cause confirmed: only the 5 tab-bar labels had Figtree (explicit `fontFamily`); the `Text.render` patch does nothing on RNW (88 text nodes were system font). Fix: `WebDocumentHead.tsx` now loads Figtree from Google Fonts (400–900) + a global `*{font-family:'Figtree'…!important}` default (safe — icons are SVG). Verified: all text renders Figtree with correct weights on Home/Profile/Leaderboard.
- **[H] DB open-contention now self-recovers** — a naive open-retry made it worse ("Invalid VFS state" — re-opening wa-sqlite in the same document corrupts the VFS), so reverted that. Instead `_layout.tsx` auto-reloads (max 2×, sessionStorage-guarded, cleared on success) since a reload reliably frees the old OPFS handle; `client.web.ts` also closes the handle on `pagehide`. Verified: cold full navigation to `/leaderboard` renders with no error screen.

## 🆕 New finding (seen during fix verification)
- **[M] `/leaderboard` segmented toggle overlaps** — the "Today / All-time XP" control: "All-time XP" wraps to two lines and renders **behind** the active "Today" pill at 390px. Likely a fixed-width/absolute-indicator segmented control that doesn't fit the longer label. `mobile/src/app/leaderboard.tsx`.

## ✅ Fixed this session — round 3 (rebuilt + verified live)
- **[M] `/leaderboard` toggle overlap** — the segmented control had `self-center` with no base width, so on RNW it collapsed to content width and the two `flex-1` segments couldn't divide → "All-time XP" wrapped behind the "Today" pill. Now stretches full-width on phone (caps+centers only at `lg`). Verified: equal 182px segments, single line, no overlap. `leaderboard.tsx:32`.
- **[M] Dev sign-in message removed** — profile no longer shows "set Supabase keys in app.json"; when Supabase is unconfigured the sign-in card is hidden and the subtitle reads "Playing locally · progress saved on this device". Verified live. `(tabs)/profile.tsx`.
- **[L] Theme-option button role** — added `accessibilityRole="button"` + `accessibilityState.selected` in `ThemeSwitcher.tsx`.

## Resolved as non-issues
- **[L] Icon default hex `#20303a`** — every `<Icon>` callsite passes an explicit `color` (via `themeColor(...)`), so the hardcoded default is never rendered. Latent only; left as-is.

## ⏳ Still open
- Full per-page visual pass on the ~14 not-yet-walked routes (see Codex handoff).

---

## Codex independent pass

Scope: fresh pass on `mobile/dist` at 390px mobile emulation, treating the fixed items above as already handled. Rebuilt with Node 22 because the default Node 18 shell cannot run Expo 57 (`configs.toReversed` / Node >=20.19.4 required). Screenshots captured in `/tmp/flaggo-codex-audit`.

### Fixed this pass
- **[M] Trivia active-round Continue skipped unanswered questions** — live. In `/trivia`, the muted/disabled-looking `Continue` button advanced to a new question before any answer was selected. Fixed by guarding `continueNext()` when there is no feedback. `mobile/src/app/trivia.tsx:87`. Verified live: tapping `Continue` without answering leaves the same prompt/countries in place.
- **[M] Flag-tile misses were unreviewable in results** — live. Missed `pick-flag` questions in `/quiz` and arcade results showed `You: —` because normalized flag options dropped the country label. Fixed by preserving `label: c.name` for flag-layout options. `mobile/src/quiz/describeQuestion.ts:78`. Verified live: arcade result review now shows chosen country names for missed flag-tile questions and no `You: —`.
- **[L-M] Map identify results used the wrong verb** — live. `/map/play?mode=identify` result review listed every item as `Locate ...` even though the round was Identify. Fixed the result label to use `Identify` for `identify-country` questions and `Locate` for locate questions. `mobile/src/app/map/play.tsx:60`. Verified live: identify result rows now say `Identify United Kingdom`, etc.
- **[L-M] Game footer actions hugged the bottom edge** — screenshot/code. `/quiz`, `/test`, `/trivia`, and `/map/play` used `pb-1` (4px) on pinned action footers, leaving the primary button too close to the viewport bottom at 390px. Standardized to `pb-4` (16px) and centered the trivia footer content to match other game screens. `mobile/src/app/quiz.tsx:271`, `mobile/src/app/test.tsx:162`, `mobile/src/app/trivia.tsx:152`, `mobile/src/app/map/play.tsx:154`. Verified live: quiz/trivia button bottom gap now measures 16px.
- **[L] Off-token decorative colors survived theme changes** — source/screenshot. The Home friend avatars used fixed pastel hexes, the library unstarred star overlay used `bg-black/30`, ThemeSwitcher swatches used `border-black/10`, and the reusable light pill used `bg-white`. Moved these to palette tokens: avatar tones from `accent`/`surface2`/`success`, library overlay `bg-ink/45`, swatch border `border-line`, light pill `bg-paper`. `mobile/src/app/(tabs)/index.tsx:30`, `mobile/src/app/(tabs)/index.tsx:157`, `mobile/src/app/library.tsx:75`, `mobile/src/components/ThemeSwitcher.tsx:26`, `mobile/src/components/ui.tsx:75`. Verified live with screenshots on Home/Library and token readouts.
- **[L] Welcome tagline wrap was left-aligned at 390px** — screenshot. The uppercase tagline wrapped after "daily" but the second line ("duel") did not share the centered alignment of the hero copy. Added `text-center` to the tagline and kept the CTA shell on the standard 20px mobile gutter. `mobile/src/app/welcome.tsx:23`, `mobile/src/app/welcome.tsx:30`. Verified live: computed `text-align: center`; final gutter change rebuilt into `dist`.
- **[L] Web browser chrome ignored theme changes** — live/source. The PWA `<meta name="theme-color">` was hardcoded to Ocean primary, so Parchment/Topographic/Slate still left the browser UI in Ocean. `WebDocumentHead` now reads the active theme and emits `themeColor(theme, "primary")`. `mobile/src/components/WebDocumentHead.tsx:67`, `mobile/src/components/WebDocumentHead.tsx:79`. Verified live: Parchment changed the meta value to `rgb(168 81 44)`.
- **[L] Trivia running header used a one-off full-width shell** — screenshot/source. The active `/trivia` header was not capped/centered like `/quiz`, `/test`, and `/map/play`, so it drifted on wider web while the footer had the new centered shell. Added the same `w-full max-w-[960px] self-center px-5 lg:px-8` wrapper pattern. `mobile/src/app/trivia.tsx:136`. Verified live at 390px and source-checked for desktop cap.
- **[L-M] Auth callback button nearly touched phone edges** — live. `/auth/callback` used a centered `p-6` screen with an inner `max-w-sm`, yielding only ~3px horizontal gutters on the web callback error CTA at 390px. Reworked loading/error states to a standard `w-full max-w-[420px] self-center px-5` shell. `mobile/src/app/auth/callback.tsx:36`, `mobile/src/app/auth/callback.tsx:38`, `mobile/src/app/auth/callback.tsx:44`. Verified live: error state button uses the page shell instead of edge-to-edge width.
- **[L] Decks quick-builder regions had an orphan final row** — screenshot/source. The five region buttons rendered as a 2-column grid with `Oceania` stranded at 48% width on the left. The odd final item now fills the mobile row while keeping the five-across desktop width. `mobile/src/app/decks.tsx:125`, `mobile/src/app/decks.tsx:131`. Rebuilt into `dist`; source/static bundle verified after the final patch.
- **[L] DB fallback copy/color still used old brand and hardcoded slate** — source. The fallback screen had `Flaggo could not open...` plus fixed `#0f172a` / `#475569` text colors. Without changing the OPFS reload behavior, the fallback now says Flaggo and uses the default theme tokens with a 20px mobile shell. `mobile/src/app/_layout.tsx:109`, `mobile/src/app/_layout.tsx:123`. Rebuilt into `dist`; source/static bundle verified.

### Verification
- `npx tsc --noEmit` ✅
- `npm run export:web` ✅
- 390px route pass covered `/`, `/welcome`, `/review`, `/learn`, `/challenge`, `/library`, `/decks`, `/stats`, `/arcade`, `/trivia`, `/map`, `/map/explore`, `/map/play`, `/test-setup`, `/test`, `/quiz`, `/leaderboard`, `/friends`, `/auth/callback`, `/match/example` with no unexpected horizontal overflow.
- Full playthroughs completed into results for daily quiz, arcade quiz, custom test, and map identify. Active trivia was tested for the fixed no-answer Continue behavior and normal answer flow.
- Theme switching verified for Ocean/Parchment/Topographic/Slate: token variables updated, `worldly-theme` persisted, and selected theme carried into `/review`.
- Visual consistency follow-up verified tokenized Home avatars, Library star overlays, paper-token light buttons, and 16px game-footer bottom spacing at 390px.
- Baseline smoke rechecked Home/Profile/Leaderboard after fixes: all rendered at 390px with no console errors or horizontal overflow.
- Follow-up UI pass screenshots captured in `/tmp/flaggo-codex-audit/more`; live-confirmed welcome centering, auth callback shell, theme-color updates, and Decks orphan-row issue. A final post-patch Chrome reload for the last Decks/welcome-gutter/DB-fallback changes was blocked by the environment's browser-escalation usage limit, so those final small changes were verified by `tsc`, `export:web`, and static `dist` inspection.

---

## Verification status by route

| Route | Live-verified | Notes |
|---|---|---|
| `/` Home (Today) | ✅ | Renders correctly, matches mock. Clean baseline. |
| `/profile` (You) | ✅ | Renders; theme switch WORKS; issues below. |
| `/friends` | ✅ | Clean signed-out empty state. |
| `/leaderboard` | partial | Reached; not deep-audited. |
| `/quiz` + results | fixed earlier | Flag options, results layout, buttons fixed earlier this session — re-verify. |
| `/review /challenge /learn /library /decks /stats /arcade /trivia /map /map/explore /map/play /test-setup /test /welcome /match/[id] /auth/callback` | ⏳ | Not individually walked this pass (session budget). Cross-cutting findings below apply to them. |

---

## GLOBAL / cross-cutting findings (highest value — fix these first)

### [H] DB fails to open on full-page load / refresh (OPFS handle contention) — live, reproduced repeatedly
Navigating to any route via a **full page load** (hard refresh, deep link, or a second tab) frequently shows the error screen:
> "Flaggo could not open its local database. NoModificationAllowedError: Failed to execute 'createSyncAccessHandle' … Access Handles cannot be created if there is another open Access Handle or Writable stream associated with the same file."

- Cause: OPFS `SyncAccessHandle` is **exclusive per origin**. A prior page/context's handle isn't released before the new load opens one.
- Reproduced on `/` and `/profile` this pass; **recovers on reload** once the old handle releases.
- Real-world impact: hard-refresh on any subpage, opening the app in a 2nd tab, or a fast deep-link can drop the user on the error screen.
- Likely area: `mobile/src/db/client.web.ts` / `db/bootstrap.ts` (OPFS open). Consider: release the handle on `pagehide`/`beforeunload`; retry-with-backoff on `NoModificationAllowedError`; or fall back to a non-exclusive access mode. The error fallback screen is `mobile/src/app/_layout.tsx:73-76`.

### [M–H] Figtree brand font is NOT applied on web — live, confirmed via computed styles
Every heading/label on Home computes `font-family: -apple-system, system-ui, …`, not Figtree (e.g. "Today" 32/900, "Today's Five" 30/900, section labels, buttons — all system font). The brand typography is missing app-wide on web.
- The `applyFigtreeDefault()` `Text.render` monkey-patch (`mobile/src/theme/fonts.ts`) isn't taking effect for RNW, and/or the web font isn't loaded/registered.
- Impact: the whole app looks off-brand on web vs the mock.

### [M] `Animated.*` components silently drop NativeWind `className` on web
Established this session (it collapsed the flag answer options, since fixed). Remaining instances still carry classes that get dropped — here only `gap`/alignment, so the effect is **missing spacing** (children touch) rather than full collapse:
- `mobile/src/app/test.tsx:115` — `Animated.View … className="gap-4"` (test screen: options/flag panel spacing lost)
- `mobile/src/app/trivia.tsx:146` — `Animated.View … className="gap-4"` (trivia body spacing lost)
- `mobile/src/app/match/[id].tsx:66` — `Animated.View … className="items-center gap-3"` (match header spacing/centering lost)
- `mobile/src/components/QuestionCard.tsx:43` — `Animated.View … className="gap-3 lg:items-center"` (question prompt: flag panel and prompt text spacing lost)
Fix pattern (as done for QuestionCard options): move layout classes to a plain `View` wrapper; keep the reanimated `entering` on an inner/animation-only node, or drop it.

### [M] Developer message leaks to end users
Profile shows literally: *"Sign-in isn't configured yet (set Supabase keys in app.json)."* (`mobile/src/app/(tabs)/profile.tsx`, sign-in card). Fine for dev, wrong for users — either hide the sign-in card when Supabase is unconfigured, or show a neutral message.

### [L] Icon default color is a hardcoded off-theme hex
`mobile/src/components/Icon.tsx:45` — `color = "#20303a"` default. Any `<Icon>` rendered without an explicit `themeColor(...)` will show Ocean-ink even under Parchment/Topographic/Slate. Audit callsites or make the default theme-aware.

### [L] Theme options lack a button role (accessibility)
The theme rows in `ThemeSwitcher.tsx` are `Pressable`s but expose as `generic` (no `accessibilityRole="button"`), unlike the Friends/Leaderboard rows which are `button`s. Add a role for a11y/keyboard.

---

## Per-page findings (live-verified)

### `/` Home (Today) — ✅ good
- Renders faithfully to the mock: header "Today" + date + streak pill; teal daily hero "Today's Five" with correct progress pips (3/5) + "Play again" + "You scored 3/5 today"; "Challenge a friend" card; Quick-play 2×2 (Flags / Capitals / Find on map / Trivia); bottom tab bar (Today/Play/Challenge/Learn/You).
- No horizontal scroll, no broken images, no collapsed containers, no console errors.
- Only issue: global Figtree (above).

### `/profile` (You) — ✅ renders, 2 issues
- **[H] "Reset progress" button is dead on web** — code: `mobile/src/app/(tabs)/profile.tsx:47` uses `Alert.alert("Reset progress?", …, [Cancel/Reset])`. `Alert.alert` is a **no-op on react-native-web**, so the confirm dialog never appears and the destructive action never runs. Needs a web-safe confirm (e.g. `window.confirm`) — same class as the Challenge button fixed earlier.
- **[M] Dev message** (global, above).
- Theme picker: **WORKS** — switching to Parchment re-themed the whole app (avatar/tab/borders/Active badge all terracotta) and persisted across reload (`localStorage worldly-theme=parchment`). Not a bug.
- Stats tiles (60% Accuracy / 0 Mastered / 30 XP), Compete rows, appearance list all render cleanly.

### `/friends` — ✅ good
- Correct signed-out empty state: "Sign in to see friends" + explanatory copy + "Go to sign in" button. Pushed route → no bottom tab bar (expected). Client-side nav in and out works with no DB error (confirms in-app navigation is fine; the DB bug is specific to full page loads).

---

## Recommended fix order
1. **[H] DB open contention** on full load/refresh — most user-visible breakage.
2. **[H] Reset-progress dead button** (Alert.alert → window.confirm on web).
3. **[M–H] Figtree font not applying** on web — whole-app visual correctness.
4. **[M] Animated.View className drops** — restore spacing on test/trivia/match/quiz-prompt.
5. **[M] Dev sign-in message** → user-appropriate copy / hide.
6. **[L]** Icon default color; theme-option button role.

---

## Appendix
- Screenshots captured this pass (390px): `.ui-audit/home.png`, `.ui-audit/profile.png`, `.ui-audit/profile-parchment.png`. Earlier agent captures (≈500px, both widths) in `/tmp/ui-audit/` for home/review/challenge/learn/profile/welcome/leaderboard.
- Console: no JS errors on Home/Profile/Friends other than the DB `NoModificationAllowedError` when it occurs on full load.
- Not yet walked individually (session budget): review, learn, challenge, library, decks, stats, arcade, trivia, map/map-explore/map-play, test-setup, test, quiz-results (re-verify — fixed earlier), welcome, match/[id], auth/callback. Cross-cutting findings above apply to all.
</content>
</invoke>
