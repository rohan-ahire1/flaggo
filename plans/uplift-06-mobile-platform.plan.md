# Uplift Phase 6 — Mobile Platform & Cross-App Polish

## Summary

Close the mobile gaps (account deletion, auth parity, review flows actually using the due
queue), replace the fragile OPFS/SQLite driver on mobile-web with localStorage, add
haptics/motion/sound, map pinch & wheel zoom on both apps, performance touches, Android
store readiness (predictive back, eas.json, asset cleanup).

## Implementation Changes

### 1. Mobile account deletion (Play Store requirement)

- `mobile/src/auth/actions.ts`: add `deleteAccount(): Promise<Result>` — POST
  `${env.siteUrl}/.netlify/functions/delete-account` with header `Authorization: Bearer
  <session.access_token>` (get session via `supabase.auth.getSession()`); on OK: `signOut()`
  and return `{}`; else return `{ error }`.
- `mobile/src/app/(tabs)/profile.tsx`: when signed in, add a "Danger zone" section under
  Reset progress: text button "Delete my account & data" (error color) → confirm dialog
  (native `Alert.alert` two-step: "Delete account? This removes your synced progress,
  scores and matches permanently." Cancel/Delete-destructive; `window.confirm` on web) →
  `deleteAccount()` → on success `resetAllProgress()` + notice "Account deleted".

### 2. Mobile auth parity

- Forgot password: in the Profile sign-in card (signin mode), add text link "Forgot
  password?" → prompt for email field value → `supabase.auth.resetPasswordForEmail(email,
  { redirectTo: `${env.siteUrl}/auth/callback?type=recovery` })` → notice "Check your
  email". (Reset completes on the web app — acceptable.)
- Username-only signup: in signup mode add a "Username only (no email)" toggle. When on:
  hide email field; validate with `isValidUsername`; POST
  `${env.siteUrl}/.netlify/functions/username-signup` `{ username, password }`; then
  `signInWithPassword(usernameToEmail(username), password)`. Port `usernameToEmail` +
  `isSyntheticEmail` into `mobile/src/lib/username.ts` (match web `src/lib/username.ts`).
  When the signed-in email is synthetic, the identity card subtitle shows
  "Username account · no email" (like web).

### 3. Review flows use the actual due queue

- `mobile/src/app/quiz.tsx`: support `params.codes` (comma-separated country codes). When
  present, build the pool `countries.filter(c => codes.includes(c.code))` and use
  `generateReviewQuestions(pool, topic)`; question count = pool-driven (cap 12).
- `mobile/src/app/(tabs)/review.tsx`:
  - "Start review" passes `codes: due.map(c => c.code).join(",")` when `due.length`,
    else the weak set, else omit (current behavior). Button label: "Start review" when
    due, "Practice anyway" when nothing due.
  - Weakest flag tiles → `router.push({ pathname: "/quiz", params: { mode: "lesson",
    topic, codes: c.code } })` (single-country focused practice).
- Web already passes explicit groups — no change.

### 4. Sync status copy + friendly challenge error (mobile)

- `(tabs)/profile.tsx` sync chip mapping: `local`→"Saved on device", `loading`→"Syncing…",
  `saving`→"Syncing…", `saved`→"Synced", `error`→"Sync issue". Keep the chip.
- `mobile/src/social/challenge.ts` `promptChallenge`: when the failure is a sign-in
  requirement (error message contains "sign in", case-insensitive, or no session), show a
  two-button dialog: "Sign in to challenge friends" with actions [Not now] /
  [Go to sign in → router.push("/profile")] — native `Alert.alert` buttons, `window.confirm`
  fallback on web (OK → navigate). Other errors keep the current notice.

### 5. Mobile-web storage: drop OPFS/SQLite on web

- New `mobile/src/utils/storage.web.ts` implementing the exact same exported API as
  `mobile/src/utils/storage.ts` (`loadProgress`, `saveProgress`, `saveSyncedProgress`,
  `loadProgressMeta`, `resetProgress`, `needsAnonymousMerge`, `clearAnonymousMergeMarker`,
  plus anything else exported) backed by `localStorage` with the SAME keys/format as the
  web app's `src/utils/storage.ts` (`worldly-progress` etc. — copy the web implementation
  and keep functions async to match the mobile signatures).
- Rename current implementation to `mobile/src/utils/storage.native.ts`; keep a
  `storage.ts` re-export only if imports elsewhere need a bare path — otherwise rely on
  Metro platform resolution (`.web.ts` / `.native.ts`).
- `mobile/src/db/client.web.ts`: reduce to a stub whose `initDb()` resolves immediately
  (no wa-sqlite, no OPFS). Remove the wa-sqlite wasm copy step from
  `mobile/scripts/copy-sqlite-wasm.js` usage in `package.json` `export:web` if it becomes
  unused. `_layout.tsx`: delete the RELOAD_KEY auto-reload effect and the DB error screen
  web-specific caveats (keep a generic error screen for native init failures).
- Result: hard refresh / second tab on mobile-web can never hit the OPFS handle error.

### 6. Haptics + motion (native)

- Add `expo-haptics`. In `mobile/src/app/quiz.tsx` `select()`:
  `Haptics.notificationAsync(Success|Error)` on reveal (fire-and-forget, native only).
  Light `impactAsync(Light)` on option press-in (QuestionCard Pressable onPressIn).
- Motion (reanimated, already a dep): QuestionCard mounts with `entering={FadeInDown
  .duration(220)}` on a plain wrapper that does NOT carry NativeWind layout classes
  (per the known Animated/className web pitfall — layout classes stay on inner Views);
  RoundResults hero (`ScoreRing` container) `entering={ZoomIn.springify()}`; results list
  rows `entering={FadeInUp.delay(i * 30)}` capped at 10 rows.

### 7. Sound effects (web)

- New `src/lib/sfx.ts`: WebAudio, no assets. `playCorrect()` = 880 Hz sine 90 ms with quick
  decay; `playWrong()` = 220 Hz triangle 140 ms; `playComplete()` = 3-note ascending
  arpeggio (523/659/784 Hz, 80 ms each). Lazy `AudioContext` created on first user
  gesture; all calls no-op when muted. Mute state in localStorage `flaggo-sfx`
  (default ON), exposed via `isSfxEnabled()/setSfxEnabled()`.
- Hook calls: FeedbackPanel mount (correct/wrong), RoundResults mount (complete).
- `ProfileScreen`: "Sound effects" toggle row in the Appearance section.

### 8. Map zoom (web `src/components/WorldMap.tsx` + mobile `mobile/src/components/WorldMap.tsx`)

- Raise `MAX_SCALE` to 1600 (both).
- Web: wheel zoom — `onWheel` with `event.preventDefault()` (`passive: false` via ref
  listener), `zoom(event.deltaY < 0 ? 1.15 : 1/1.15)`. Pinch — track two active pointers
  in a Map (pointerdown/move/up); when two pointers, scale by
  `currentDistance/previousDistance` per move (clamped), suppress rotation drag while
  pinching. Double-click/double-tap → `zoom(1.6)` centered (keep simple: plain zoom).
- Mobile: same two-pointer pinch math on the existing responder/pointer handlers used for
  drag (mobile WorldMap mirrors web's structure; apply the identical approach adapted to
  its event system). If the mobile WorldMap uses react-native-gesture-handler, add a
  `PinchGestureHandler` (or `Gesture.Pinch()`) wrapping the map that adjusts scale state.
- Keep the zoom buttons on both.

### 9. Performance touches (web)

- `src/utils/preloadFlags.ts`: schedule via `requestIdleCallback` (fallback
  `setTimeout 2000`); load in chunks of 20 with 200 ms gaps; start with the `easy`
  difficulty bucket, then the rest. Export unchanged signature.
- `src/components/FlagImage.tsx`: ensure `loading="lazy"` + `decoding="async"` on the
  underlying `<img>` (add if missing).

### 10. Mobile icon default color

- `mobile/src/components/Icon.tsx`: default `color` becomes `undefined`; inside the
  component resolve `color ?? themeColor(useThemeStore.getState().theme, "ink")` (or use
  the hook if the component is already a function component rendering per-theme). Remove
  the hardcoded `#20303a`.

### 11. Android store readiness

- `mobile/app.json`: `android.predictiveBackGestureEnabled: true`;
  `android.edgeToEdgeEnabled: true` (SDK 57 field; if typed-routes typegen complains,
  keep the flag and note it); bump nothing else.
- New `mobile/eas.json`: `cli.appVersionSource: "remote"`; profiles:
  `development` (developmentClient true, internal), `preview` (internal distribution,
  android buildType `apk`), `production` (autoIncrement true, android buildType
  `app-bundle`).
- Asset cleanup in `mobile/assets/images/`: grep the repo for usages, then delete unused
  template assets (`react-logo*.png`, `expo-badge*.png`, `expo-logo.png`,
  `tutorial-web.png`, the `expo.icon/` folder, `logo-glow.png` if unreferenced). Do NOT
  delete anything still referenced by `app.json` or code.

## Test Plan

- `npm test`, `npm run build` (web) — including sfx module unit test (enabled flag
  toggling; AudioContext mocked/no-op in jsdom).
- `cd mobile && npx tsc --noEmit`.
- Summary must state: grep shows no `wa-sqlite`/OPFS reference on the web path of mobile;
  `codes` param round-trips (review due → quiz pool) verified by code walkthrough;
  deleted asset list + proof of no remaining references.

## Assumptions

- `env.siteUrl` points at the deployed Netlify site so the delete-account/username
  functions are reachable from the native app.
- Web password-recovery completion on the website (not in-app) is acceptable for mobile
  users.
- No dark theme yet — `StatusBar style="dark"` remains correct for all four palettes.

## Acceptance Criteria

- Signed-in mobile user can delete their account from the app.
- Review CTA plays exactly the due/weak countries it advertises; weakest tiles practice
  that specific country.
- Mobile-web never shows the "could not open its local database" screen (driver removed).
- Pinch/wheel zoom works on both maps; microstates reachable at max zoom.
- `eas build --profile production -p android` is configured (not run) and template
  assets are gone.
