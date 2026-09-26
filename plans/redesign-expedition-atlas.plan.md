# Flaggo redesign: "Expedition Atlas"

Status: draft, 2026-09-26. Direction A chosen by the user. Brief: keep both audiences (adults and kids), rethink everything, **only better, never worse**.

Companion files (outside the repo):
- `~/flaggo-assets/ASSET-BRIEF.md`: the 33 AI images the user is generating (pilots first).
- `~/flaggo-assets/flaggo-parity-inventory.md`: the exhaustive current-feature inventory. It's the source of truth for the parity checklist.

---

## 1. Guardrails (the "never worse" contract)

1. **No data loss.** `AppProgress`, the `flaggo-progress*` / `flaggo-kids` / `flaggo-sfx` / `flaggo-onboarding-complete` / `worldly-theme` localStorage keys, Supabase sync and `mergeProgress` stay compatible. Schema changes are **additive only**, and `normalizeProgress` must accept both old and new payloads.
2. **No feature loss.** Every control, mode, option and reward in the inventory (§2 of it) exists after the redesign, or is on the explicit "dropped on purpose" list in §6 below, which the user signs off.
3. **Old URLs keep working.** Every current route either still renders or redirects to its new home (§3.3), including query params such as `/arcade?mode=progressive&start=1`.
4. **Game logic stays in `packages/core`.** The redesign is a UI rebuild. Core changes are limited to the bug fixes in §5, each with a unit test.
5. **Performance and accessibility can't regress.**
   - Lighthouse mobile performance ≥ the current baseline.
   - Images are AVIF/WebP, responsive, and lazy-loaded below the fold.
   - Largest Contentful Paint (LCP) is ≤ 2.5s on mid-tier mobile.
   - Keyboard shortcuts stay (1–4 answer, Enter continue, arrow keys in flashcards, keyboard map).
   - Focus traps and aria-live regions stay.
   - **`prefers-reduced-motion` is honoured everywhere.** It's only honoured in one place today, and the new design is motion-heavy.
6. **Offline and PWA stay intact.** Flag CacheFirst, precache and install prompt keep working. New art gets a size budget (see §7).
7. **It's built on a `redesign` branch.** It merges only after the parity checklist (§8) passes with before/after screenshots.

## 2. Core concept: your world fills in

The data already supports it: `isMasteredReview(state)` defines mastery per country and topic.

- Every country has a visible state on the user's globe or atlas:
  - **Unseen:** blank paper.
  - **Learning:** has a review state and isn't mastered; drawn as ink hatching.
  - **Mastered:** painted in. The country shape is filled with its own flag (SVG clipPath of the flag inside the country's d3-geo path).
- The **primary progress metric** changes from raw XP to **"N / 200 flags mastered"** plus the painted globe. XP stays as a secondary counter (§5).
- The "moment of joy" on a correct answer: a passport-stamp animation, and on mastery, the country visibly paints in on the mini-globe.
- Kids Mode has the same loop in its own style: stickers, and islands that fill with colour as they're collected.

## 3. Information architecture

### 3.1 Adult app: 5 destinations

| Destination | Route | Contains | Replaces |
|---|---|---|---|
| **Home** | `/` | Painted globe (your world), today's plan: "N due for review", continue current stage, daily challenge card with streak. Also a Kids Mode entry. | HomeScreen |
| **Play** | `/play` | A shelf of illustrated game covers: Daily, Arcade (timed / 3-strikes / progressive), Trivia (3 formats, timed / sudden-death), Map quiz (locate / identify), Custom quiz (topic, set, recall/options). Best scores are shown on each cover. | Home's "More ways to play", `/arcade` + `/trivia` + `/map` + `/test-setup` setup screens |
| **Learn** | `/learn` | The 4-stage journey as a route map (stage art from the brief), the review queue (due / weak), flashcards, and decks. | `/review` hub, `ProgressiveResults`, `/decks` |
| **Atlas** | `/atlas`, `/atlas/:code` | Globe explorer plus the searchable flag library (region and status filters), and a **new country page**: flag, capital, currency, languages, neighbours, location on the map, your record, "practice this country". | `/library`, `/map/explore` |
| **You** | `/you` | Stats, badges, streak history, account (sign in/out, delete), settings (theme, sound, install app), legal links. | `/stats`, `/profile` |

Navigation:
- **Mobile:** a 5-tab bottom bar.
- **Desktop (≥1024px):** a left rail (5 destinations + Kids) and main content. On Home, Learn and Atlas, the globe lives in a persistent right panel. On Play, the covers form a wide grid. **No more phone column floating on a blank page.**

### 3.2 Round screens (play surfaces)

Current routes stay: `/review/play`, `/review/flashcards`, `/test`, `/daily`, `/arcade` (running), `/trivia` (running), `/map/play`. They're immersive (no nav chrome) and share one new **Round shell**:
- Header: exit (with the existing confirm dialog), progress, and timer/strikes when the mode has them.
- **Flag specimen card:** a large flag on a paper mount with a soft drop shadow. The flag is the hero, at about 60% of the viewport width on mobile.
- Answer tiles: the same 4-option semantics and number-key shortcuts.
- Feedback sheet:
  - **Correct:** stamp animation plus a +XP pop.
  - **Wrong:** the correct answer is revealed, plus a new **"learn moment"**: a mini-map showing where the country is and its capital, taken from the existing dataset.
- **Results: a "voyage log".** Score, stamps earned this round, which countries moved up a box or were mastered (with paint-in), badges earned, and the missed list with "practice missed". It replaces `RoundResults` and `ScoreRing` visually and keeps all their data.

### 3.3 Route migration

| Old | New |
|---|---|
| `/review` | `/learn` (the review section) |
| `/decks` | `/learn#decks` or `/learn/decks` |
| `/library` | `/atlas` |
| `/map/explore` | `/atlas` (globe mode) |
| `/map` (menu) | `/play#map`, or a map cover sheet |
| `/test-setup` | `/play` (custom-quiz sheet) |
| `/stats`, `/profile` | `/you` |
| `/learn/*`, `/lesson` (legacy) | Stay redirected (to `/` and `/learn` respectively) |

All other routes, including `/kids/*`, `/privacy`, `/terms`, `/auth/callback`, `/welcome` and `*`, stay unchanged.

### 3.4 Welcome

A full-bleed parallax hero (depth-mapped `hero-desktop` / `hero-mobile`, the same technique as the Koke & Stone prototype). Headline in the empty sky, with three steps: pick → play → watch your world fill in.
- The primary CTA starts the first stage round.
- The secondary CTA goes to the daily challenge. This fixes the VPS's half-finished edit where both CTAs went to Home.
- A tertiary link: "Playing with a kid? → Kids Mode".

### 3.5 Kids Mode

It keeps its world, games, sticker book, voice and parental gate exactly.
- It becomes **reachable**: a Home tile plus the Welcome link. Entering needs no gate; leaving still needs the gate.
- The immersive-chrome bug on `/kids/*` game screens is fixed (§5).
- It moves onto the shared component primitives with a kids skin (Baloo 2 / Nunito, kid palette), and gets the mascot poses and game covers from the asset brief.
- Islands fill with colour as their flags are collected, echoing the adult "world fills in".

## 4. Visual system

- **Palette tokens (adult Day theme):**
  - paper #F6F0E3, sand #E9DCC0
  - ink navy #1E2F3F, sea teal #2F6F73
  - terracotta #C8643B (primary action), moss #4F7A4A (success)
  - brass #C9A04A (rewards / XP), error brick #B23A2E
  - All pairs AA-checked.
- **Themes:** replace the 4 palettes with **Day** (default) and **Dusk** (a dark, lamplit-atlas version), plus a "match system" option. Stored in the same `worldly-theme` key, with old values mapped: ocean/parchment/topographic → day, slate → day.
- **Type:**
  - Display: **Fraunces** (soft, a touch of character; not Bodoni-like at the weights we use). Worth testing against a sturdier alternative such as **Young Serif** in the mockups.
  - Body and UI: **Figtree** (kept).
  - Numbers: tabular figures.
  - Kids: Baloo 2 / Nunito (kept).
- **Surfaces:** watercolour-paper texture (tiled, very subtle), ink-line borders instead of hard grey outlines, and "mounted" cards with a paper edge and soft shadow.
- **Distinct component shapes:**
  - **Actions:** solid terracotta pills.
  - **Answers:** tall paper tiles.
  - **Info:** flat cards.
  - **Rewards:** brass stamps.
- **Iconography:** Phosphor (kept) in duotone, recoloured to ink and brass.
- **Motion** (the `motion` library, gated by one `useReducedMotion` hook):
  - Page transitions: paper slide/fade, 200–300ms.
  - Globe: slow idle rotation that pauses on interaction.
  - Correct answer: stamp press (scale + rotate, ink bleed).
  - Wrong answer: card shake, then a gentle map fly-to.
  - Mastery: country paint-in with a brush-reveal mask.
  - Results: a staggered log.
  - Welcome: parallax depth.
  - Kept moderate (user feedback on another project: excess motion felt "a bit too much").
  - With reduced motion: instant state changes with crossfades only.

## 5. Bugs and gaps fixed during the redesign

Each fix is small, lives in core or its screen, and has a test.

1. **Streak is broken.** `progress.streak` is never updated, so Home, Stats and Profile always show 0. Fix: an **activity streak** where any completed round counts for the day, updated through the existing `updateStreak()` on round completion. The daily-challenge streak (`daily.streak`) stays for its badge and is shown on the Daily card. 
2. **Arcade best scores are never saved.** Call `persistArcadeBest()` so they show on the Play covers.
3. **Trivia gives 0 XP.** Award +10 per correct answer, matching the other modes.
4. **Kids Mode is unreachable.** Add entry points (§3.5).
5. **Kids game screens show adult nav chrome.** Make `/kids/*` immersive.
6. **Reduced motion is ignored.** Honour it globally (§4).
7. **Coins are shown but never earned.** Remove them from the UI; keep the field in data.
8. **Stale docs.** Update `CLAUDE.md` and `docs/ARCHITECTURE.md` to the real routing, and delete or archive `UI-AUDIT.md`, which covers the deleted mobile app.

## 6. Decisions (signed off by the user on 2026-09-26)

1. **Streak:** any completed round counts toward the main streak. The daily-challenge streak stays as its own stat and badge.
2. **Themes:** Day + Dusk + follow-system replace the 4 palettes; old values map to Day.
3. **Atlas country pages:** in scope.
4. **Build ownership:** Opus designs and builds (the user's override of the global planner-only rule, for this project).

Deliberately **not** in scope: multiplayer or leaderboards (dropped by migration), monetization UI, the ~50 countries outside the 4 stages (they stay reachable via Atlas, Custom quiz and Map), and a rendered image for sticker-book sharing (possible later).

## 7. Asset pipeline

- Source PNGs go in `~/flaggo-assets/`. Processing:
  - Background removal (rembg) where needed.
  - Export to AVIF + WebP at 1x/2x.
  - Hero depth maps (Depth Anything V2, as in the Koke & Stone prototype).
  - Output goes to `public/art/...`.
- **Budgets:** hero ≤ 250KB AVIF per breakpoint; covers ≤ 80KB; spots ≤ 30KB; total new art precached ≤ 1.5MB. Anything else is runtime-cached rather than precached.
- Until the art arrives, mockups use flat colour placeholders at the correct aspect ratios.

## 8. Phases

| Phase | Output | Gate |
|---|---|---|
| **0. Prep** | A `redesign` branch. Docs fixed. Baseline screenshots of every route (desktop + mobile), stored for comparison. Bring over the VPS's Playwright e2e setup as the parity harness, if it's usable. | — |
| **1. Mockups** | Static mockups with the pilot art: Welcome, Home, Round (question + correct + wrong + results), Play, Learn, Atlas + country page, and Kids home. Phone 390 and desktop 1440. | **User picks and approves the look** |
| **2. Foundation** | Tokens, fonts, texture, motion system and reduced-motion hook. Primitives: button, tile, card, stamp, flag specimen, sheet, dialog. The app shell with bottom bar and desktop rail. Painted globe component (d3-geo orthographic, state fill, flag clip for mastered countries). | Storybook-style visual check |
| **3. Rounds** | The shared Round shell plus all 7 round screens and the voyage-log results. | Every question type plays; keyboard works |
| **4. Destinations** | Home, Play, Learn, Atlas (+ country pages), You, Welcome, and route redirects. | Old-URL redirect test |
| **5. Kids** | The kids skin on shared primitives, new covers and mascot poses, island fill, entry points, and the chrome fix. | Kids flows play end to end |
| **6. Fixes and hardening** | The §5 fixes with tests. Offline check, Lighthouse, axe a11y scan, reduced-motion pass, and a progress-migration test (load an old payload and see it render correctly). | Parity checklist 100% |
| **7. Ship** | A Netlify preview deploy for the user to try. Production only on explicit request. | User sign-off |

## 9. Parity checklist (derived from the inventory; ticked in phase 6)

- [ ] Home: stage progress (seen and mastered counts), continue-learning CTA, daily card (done vs not), a streak that is real now, all "more ways to play" entries reachable.
- [ ] Welcome: shown on first run only (same `AppLayout` rule and onboarding key); both CTAs work.
- [ ] Review: due/weak/first-8 priority; map practice; practice-missed flashcards; custom test entry.
- [ ] Review round: +10/correct, +10 completion; Leitner updates; badges; confirm on exit; invalid params redirect.
- [ ] Flashcards: swipe, arrow keys, aria-live counter, no XP.
- [ ] Custom test: Flags/Capitals, popularity tiers, recall/options, preview, speech on reveal, +5/correct, practice missed.
- [ ] Daily: seeded 5 questions, one play per day, history, streak and best, +10/correct.
- [ ] Arcade: timed 120s / 3 strikes / progressive; learning-results tab; best scores (now saved).
- [ ] Trivia: higher/lower, odd one out, true/false; timed / sudden-death; best scores; XP (new).
- [ ] Map: locate and identify; +10/correct, +10 completion; keyboard-operable countries; explore globe.
- [ ] Decks: quick builders, manual create, topic, practice, delete.
- [ ] Library: search, filters, all 250 countries.
- [ ] Stats: XP, streaks, accuracy, per-region progress.
- [ ] Profile: sign in/up/out, password recovery, delete account, theme, sound, install prompt, badges grid with dates and hints.
- [ ] Global: sign-in modal, confirm dialog, sync-error toast, ad-consent banner (flag-gated), analytics events unchanged plus new ones for Kids and Test.
- [ ] Kids: region unlock order, Learn/Find/Match rules, stickers and share, voice toggle, parental gate on exit and voice, separate storage, never synced.
- [ ] System: privacy, terms, auth callback (both flows), 404, PWA install, offline flags.
