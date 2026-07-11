# Uplift Phase 8 — One Button System (web)

## Summary

Web buttons currently differ structurally between variants (primary has a 3D shadow
edge, secondary is flat, ghost is a bare underlined text link) and several screens use
ad-hoc inline button styling. Rebuild the button classes so every action button shares
ONE anatomy — identical height, radius, border width, typography, icon spacing, press
behavior — with variants differing in color only. Formalize the small-control families
(chips, icon buttons) the same way and sweep all callsites. Mobile is out of scope
(its single PillButton component is already consistent).

## Button anatomy (identical across variants)

Rewrite in `src/index.css` `@layer components`:

```css
.btn-base {
  @apply inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl
    border-2 px-5 py-3 text-center font-display text-[17px] font-semibold
    tracking-wide transition-all duration-150 active:translate-y-[1px]
    disabled:cursor-not-allowed disabled:opacity-50;
}
.btn-primary   { @apply btn-base border-transparent bg-primary text-white shadow-card; }
.btn-secondary { @apply btn-base border-line bg-surface text-ink; }
.btn-ghost     { @apply btn-base border-transparent bg-transparent text-primary shadow-none; }
.btn-danger    { @apply btn-base border-transparent bg-error text-white shadow-card; }
.btn-inverse   { @apply btn-base border-transparent bg-paper text-primary shadow-card; } /* CTA on primary-colored heroes */
```

Rules:
- The 3D edge (`shadow-button`) is REMOVED from all buttons (the token may remain in
  tailwind.config for non-button uses like the Profile avatar ring; delete it if no
  usage remains).
- `.btn-ghost` becomes a structurally identical quiet button (no underline, same box).
  Any true inline text links (e.g. legal footer links) stay plain `<a>`/text buttons —
  links are not part of the button system.
- Icon spacing comes from the class (`gap-2`); remove per-callsite `inline-flex`
  wrapper spans where they exist only for spacing (RoundResults, ConfirmDialog, etc.).

Two additional families:

```css
.icon-btn { @apply grid h-10 w-10 shrink-0 place-items-center rounded-full border
  border-line bg-paper text-muted shadow-card transition active:translate-y-0.5; }
.chip      { @apply rounded-full border-2 border-line bg-surface px-4 py-2
  font-display text-sm font-semibold text-ink transition; }
.chip-on   { @apply border-primary bg-primary text-white; }
```

## Sweep (all under `src/`)

1. Every stacked/CTA `<button>` uses exactly one of `btn-primary | btn-secondary |
   btn-ghost | btn-danger | btn-inverse` (+ optional `w-full`). Known offenders to
   convert (not exhaustive — grep `<button` across `src/` and normalize):
   - `ProfileScreen`: inline `rounded-2xl bg-primary px-4 py-2 …` sign-in/out buttons →
     `btn-primary` / `btn-secondary` (compact is fine: add `!min-h-0 px-4 py-2` is NOT
     allowed — instead keep them full buttons; header-row context buttons may use the
     chip family if a full button doesn't fit). "Reset progress" → `btn-danger w-full`;
     "Delete my account & data" → `btn-ghost w-full text-error`.
   - `WelcomeScreen`, `ChallengeScreen`, `FriendsScreen`, `LeaderboardScreen`,
     `DecksScreen` (Practice, Weak countries, region quick-builders, Create deck),
     `ReviewScreen`, `TestSetupScreen` (Start test), `MapMenuScreen`, `ExploreMapScreen`,
     `SignInModal`, `NameClaimDialog`, `ConfirmDialog`, `FeedbackPanel` (Continue →
     `btn-inverse w-full` on the colored sheet), `RoundResults`, `HomeScreen` hero inner
     CTA (→ `btn-inverse w-full`), `AuthCallbackPage`, `NotFoundPage`, `LessonScreen`/
     `FlagTestScreen`/`MapPlayScreen`/`DailyChallengeScreen`/`ArcadeScreen`/
     `TriviaScreen` fallback "Go back/Go Home" buttons.
   - Buttons that are content cards stay as they are (explicitly excluded): answer
     options, quick-play tiles, mode/topic selector cards on Arcade/Trivia, lesson
     region cards, deck rows, flag cards, leaderboard rows, bottom-nav tabs.
2. Round-screen back/close circles and WorldMap zoom/reset buttons → `.icon-btn`
   (keep their aria-labels; WorldMap keeps `pointer-events-auto` additions).
3. Segmented/pill controls → `.chip` / `.chip-on`: PathsScreen topic pills,
   DecksScreen topic toggle, FlagsLibraryScreen segment, LeaderboardScreen tabs and
   mode/topic chip rows, TestSetupScreen mode/topic selectors where they are pill-like
   (the two large mode cards there may instead become `btn-secondary`-based with a
   selected state of `chip-on` colors — pick per current markup, keeping selected =
   primary-filled, unselected = surface).
4. Delete `.flaggo-tile` from index.css if unused after the sweep; remove
   `shadow-button` from tailwind.config if no remaining usage.

## Test Plan

- `npm test` and `npm run build` green.
- Greps stated in the summary:
  - `grep -rn "shadow-button" src/` → only non-button uses (or zero).
  - `grep -rn "underline" src/` → no underlined buttons remain (links only).
  - `grep -rnE "px-[0-9]+ py-[0-9]+" src/screens src/components | grep "<button"` →
    no ad-hoc padded CTA buttons (chips/icon-btn/cards excluded).
- Visual spot list for the operator: Welcome, Home, Daily results, Arcade setup,
  Profile, SignInModal — all CTAs share height/radius/typography.

## Assumptions

- Flat buttons with `shadow-card` on filled variants are the intended premium look
  (removes the Duolingo-style 3D edge remnant on primary).
- Mobile untouched.

## Acceptance Criteria

- Any two action buttons on any two screens have identical box metrics and typography;
  only colors differ by variant/theme.
- Ghost variant is a real button (box), not an underlined text link.
- Icon buttons and chips are each visually uniform app-wide.
