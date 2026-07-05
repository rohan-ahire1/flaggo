# Structured Learning UX Reposition Plan

## Goal

Reposition Flaggo so the product immediately reads as structured geography learning first, with daily practice and social challenge loops supporting retention. Keep Decks available as-is for MVP. Require quick sign-in before social challenge play.

## Product Decisions

- Primary identity: structured geography learning.
- Daily challenge role: habit and retention support, not the main product promise.
- Social challenges: require quick sign-in before play so scores and friend links are saved correctly.
- Decks: keep current behavior and placement for now, with only minor design-system cleanup if touching nearby surfaces.

## Success Criteria

- A new user can start a guided lesson from the first screen without interpreting a dashboard.
- `Learn`/Paths feels like the core product spine rather than a secondary tab.
- `Today` recommends the next learning action and uses Daily as a habit loop.
- `Practice` is understood as review/free play, not confused with structured lessons.
- Social challenge entry clearly explains why sign-in is required before play.
- Existing deterministic daily/match behavior is preserved.

## Scope

### In Scope

- Welcome copy and CTA hierarchy.
- First-run destination and first meaningful win.
- Bottom-nav labels only if needed for clarity.
- Home/Today content hierarchy.
- Paths/Learn prominence and topic clarity.
- Social challenge sign-in copy and gate states.
- Small design-system consistency fixes on touched buttons/headers.

### Out of Scope

- New backend schema or Supabase policy changes.
- Monetization, ads, Stripe, or paywalls.
- Deck-builder redesign.
- Major game logic changes.
- Breaking seeded daily or match question generation.

## Implementation Plan

### Phase 1: Make Welcome Start Structured Learning

Files:

- `src/screens/WelcomeScreen.tsx`
- `src/App.tsx`

Changes:

- Change Welcome positioning from daily duel to structured learning.
- Primary CTA copy: `Start learning`
- Secondary CTA copy: `Try today's challenge` or `Explore the library`
- Wire the primary CTA to open the first available guided lesson, not Home.
- Add a separate optional callback for Daily if the secondary daily CTA is shown.

Implementation detail:

- Add an `onStartLearning` handler in `App.tsx`.
- It should find the first available lesson for the current selected topic, preferably `flag`, and call existing `openLesson`.
- Avoid duplicating lesson gating logic; reuse `openLesson`.
- If no lesson is available, fall back to `paths`.

Acceptance checks:

- Fresh progress opens Welcome.
- Tapping primary CTA starts a lesson round directly.
- Completing that lesson still lands on `LessonCompleteScreen`.
- Returning users still start on Home as currently defined by progress detection.

### Phase 2: Turn Today Into a Learning Dashboard

Files:

- `src/screens/HomeScreen.tsx`
- `src/App.tsx`

Changes:

- Reframe Home/Today around the next learning step.
- Put the primary card above Daily:
  - Title: `Continue learning`
  - Copy: next topic/region/lesson count.
  - CTA: `Start next lesson`
- Keep Daily as the next card:
  - Title: `Today's practice`
  - Copy: `10 mixed questions · keeps your streak alive`
- Keep social challenge as secondary, not above learning.
- Reduce visible mode clutter:
  - Keep 2-3 quick actions only: `Review due`, `Map practice`, `Arcade`.
  - Move `Trivia`, `Library`, `Stats`, and `Decks` lower or behind a compact More section.

Implementation detail:

- `HomeScreen` already receives `lessons`, `onOpenLesson`, and `onOpenPaths` but does not use them. Use those props.
- Compute the next open lesson for `progress.selectedTopic` from `lessons`.
- If current topic has no next lesson, use a `Browse learning paths` CTA.
- Keep `Daily` accessible from Today, but not the product-defining hero.

Acceptance checks:

- First visible action on Home is learning-oriented.
- Daily remains one tap away.
- Existing actions still work.
- No new mode or route is introduced.

### Phase 3: Make Learn/Paths Feel Like The Spine

Files:

- `src/screens/PathsScreen.tsx`
- `src/components/BottomNav.tsx`
- `src/components/LessonNode.tsx` only if minor display copy is needed.

Changes:

- Keep bottom nav `Learn` as a major top-level tab.
- Add clear topic context to Paths, because it depends on `progress.selectedTopic`.
- If feasible without adding heavy UI, add topic chips for `Flags` and `Capitals` or a short line: `Learning path: Flags`.
- Make the current lesson visually obvious and tappable.
- Keep locked/upcoming states, but add clearer disabled affordance where needed.

Implementation detail:

- If topic switching is added in `PathsScreen`, `App.tsx` must pass `onTopicChange`.
- Prefer not to introduce all six topics into Paths because `PATH_TOPICS` currently only includes flags/capitals.
- Keep the lesson gating rules unchanged in `openLesson`.

Acceptance checks:

- User can tell which learning path they are viewing.
- Current lesson is visually primary.
- Locked lessons cannot be started.

### Phase 4: Clarify Practice IA Without Redesigning Decks

Files:

- `src/components/BottomNav.tsx`
- `src/screens/ReviewScreen.tsx`
- Possibly `src/screens/TestSetupScreen.tsx`

Changes:

- Rename bottom tab `Play` to `Practice`.
- Keep it pointing to `review`.
- Reframe Review as the Practice hub:
  - Primary: due review.
  - Secondary: map practice.
  - Advanced: custom test.
- Leave Decks behavior untouched.

Implementation detail:

- Bottom nav label-only change is low risk.
- Review screen copy should explain: `Practice uses spaced repetition based on what you've seen.`
- Custom test should read as advanced/completionist, not a primary path for new users.

Acceptance checks:

- Bottom tab says `Practice`.
- Review still starts the same lesson/review flow.
- Custom test remains available.

### Phase 5: Keep Social Challenge Sign-In Gate, Improve Copy

Files:

- `src/screens/MatchScreen.tsx`
- `src/screens/FriendsScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/auth/SignInModal.tsx` only if contextual title support is added.

Changes:

- Keep sign-in required before match play.
- Replace generic challenge gate copy with explicit reason:
  - `Sign in to accept this challenge and save your score.`
- Friends empty state should make the next action obvious:
  - `Challenge a friend to start your friends leaderboard.`
- If sign-in modal supports static copy only, avoid broad modal refactor; improve surrounding screen copy first.

Implementation detail:

- `MatchScreen` already blocks anonymous users before questions are shown.
- Avoid changing `submitMatchResult` or match deterministic logic.
- Keep `createAndShareChallenge` signed-in gating in `App.tsx`.

Acceptance checks:

- Anonymous challenge link opens sign-in gate before play.
- Copy explains why sign-in is required.
- Signed-in users can still play and submit results.

### Phase 6: Result Screen Next-Step Alignment

Files:

- `src/screens/LessonCompleteScreen.tsx`
- `src/App.tsx`

Changes:

- After a lesson, primary CTA should continue the structured learning loop when possible.
- Recommended action order:
  - Primary: `Continue learning`
  - Secondary: `Practice misses` if missed answers are available later; if not, omit for now.
  - Tertiary: `Back to Today`
- For MVP, the first implementation can change only the CTA label and destination if next-lesson resolution is simple.

Implementation detail:

- Current result has only `Continue` and returns Home.
- A complete version needs `App.tsx` to know the just-finished lesson and determine the next available lesson.
- Keep this phase small unless the logic becomes awkward.

Acceptance checks:

- Completing the first lesson does not feel like a dead end.
- User has a clear learning-next action.

### Phase 7: Design-System Cleanup On Touched Surfaces

Files:

- Any touched screen files.
- `src/index.css` only if a reusable helper is clearly needed.

Changes:

- Replace touched legacy primary buttons with `.btn-primary`.
- Replace touched secondary buttons with `.btn-secondary`.
- Keep existing brand colors and Fredoka style.
- Do not attempt a whole-app visual cleanup in this plan.

Acceptance checks:

- Touched screens follow existing button hierarchy.
- No broad unrelated visual churn.

## Recommended Execution Order

1. Phase 1: Welcome to first lesson.
2. Phase 2: Today learning dashboard.
3. Phase 4: `Play` to `Practice` and Review copy.
4. Phase 5: social sign-in copy.
5. Phase 3: Paths topic clarity.
6. Phase 6: lesson result next step.
7. Phase 7: cleanup only where already touched.

## Testing And Verification

Run:

```bash
npm run build
npm test
```

Manual checks:

- Fresh anonymous local progress:
  - Welcome appears.
  - Primary CTA starts a guided lesson.
  - Lesson completion records progress and shows result.
- Returning progress:
  - App opens Today/Home.
  - Main action is learning-oriented.
- Bottom nav:
  - `Practice` opens Review.
  - `Learn` opens Paths.
- Daily:
  - Still opens from Today.
  - Daily seeded questions remain unchanged.
- Social challenge:
  - Anonymous match link shows sign-in gate.
  - Signed-in match still plays and submits.
- Decks:
  - Deck screen still opens and existing practice flow still works.

## Risks

- First-lesson routing may expose assumptions in lesson generation or selected topic state.
- Home may currently rely on unused props staying unused; introducing next-lesson logic should stay simple and local.
- Result-screen continuation may require extra state in `App.tsx`; keep it small or defer if it expands.
- Changing copy from daily-first to learning-first should be consistent across Welcome, Home, and metadata/README later if desired.

## Non-Goals

- No new onboarding carousel.
- No new tutorial system.
- No social guest mode.
- No Decks redesign.
- No database migration.
