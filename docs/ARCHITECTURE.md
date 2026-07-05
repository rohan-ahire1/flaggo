# Flaggo — Architecture

Deeper architecture reference for the `flaggo` repo (brand "Flaggo"). For the quick
orientation guide see `CLAUDE.md` at the repo root.

## 1. System overview

Flaggo is a client-heavy installable PWA. Almost all game logic runs in the browser
from static data bundled at build time. Supabase provides auth, a per-user progress
store, public leaderboards, and multiplayer match storage. Netlify serves the static
site and hosts a few privileged serverless functions (account deletion, Stripe). The
app works fully offline/anonymous; signing in just adds cloud sync and social features.

```
                                  ┌─────────────────────────────────────────────┐
                                  │  Browser (React PWA, Vite build)            │
                                  │                                             │
   flagcdn.com  ───flag SVGs───▶ │  AppShell (Router + Theme + Auth)           │
   (CacheFirst SW cache)         │    └─ App.tsx  ── screen state machine ──┐   │
                                  │         screens/ • components/           │   │
   bundled at build time:        │         utils/ (quiz, SRS, seeded RNG)   │   │
   countries.ts, world-110m ────▶│         hooks/useSyncedProgress          │   │
                                  └───────┬───────────────────────┬─────────────┘
                                          │                       │
                  fetch /.netlify/...     │                       │ supabase-js
                   (Authorization: Bearer)│                       │ (anon key, RLS)
                                          ▼                       ▼
                       ┌────────────────────────────┐   ┌──────────────────────────┐
                       │  Netlify Functions         │   │  Supabase                │
                       │  (service-role key)        │   │                          │
                       │  • delete-account  [live]  │──▶│  Auth (Google + magic    │
                       │  • create-checkout [defer] │   │       link)              │
                       │  • stripe-webhook  [defer] │   │  Postgres + RLS          │
                       └─────────────▲──────────────┘   │  RPCs: top_scores,       │
                                     │                   │        friends_leaderboard│
                            Stripe ──┘ (deferred)        └──────────────────────────┘
```

## 2. Client app structure

### Bootstrap
`main.tsx` → `AppShell` wrapped in a Sentry `ErrorBoundary`.
`AppShell.tsx` sets up `BrowserRouter` → `ThemeProvider` → `AuthProvider`, plus a
`PageTracker` that loads Plausible and fires pageviews. Routes:

| Path | Component |
|------|-----------|
| `/` | `App` (the game) |
| `/privacy`, `/terms` | `LegalPages` |
| `/auth/callback` | `AuthCallbackPage` (reserved auth callback route) |
| `*` | `NotFoundPage` |

### The game shell — `App.tsx`
The game is **not** routed. `App` holds a `screen` state value (union type `Screen`,
~22 values) and renders the matching screen component; navigation is `setScreen(...)`.
`BottomNav` drives top-level navigation; some screens hide nav/footer (welcome, in-round,
match). Heavy screens (maps, arcade, daily, leaderboard, match, trivia, decks, paths,
friends) are `React.lazy` + `Suspense`. On mount it preloads flags, fires an `app-open`
event, and reads `?m=<matchId>` to jump into a multiplayer match (then strips the param).

### Directories
- `screens/` — one component per mode.
- `components/` — reusable presentational pieces (FlagCard, FlagImage, WorldMap,
  QuestionCard, AnswerOption, HeaderStats, ProgressBar, Toast, BottomNav, etc.).
- `pages/` — route-level pages.
- `hooks/` — `useSyncedProgress`, `useEntitlement`.
- `lib/` — Supabase client + data-access (`leaderboard`, `matches`), analytics, sentry.
- `utils/` — pure game logic (tested).
- `types/`, `config/`, `auth/`, `ads/`, `theme/`.

## 3. Game logic & flow

Topics (`types/topic.ts`): `flag`, `capital`, `location`, `currency`, `language`, `neighbor`.

- **Lessons / Paths:** `utils/lessonGenerator` builds an ordered lesson list per topic
  from the country set; `App.openLesson` gates progression (you can only open the next
  uncompleted lesson in a topic). Completing a lesson → `LessonCompleteScreen`.
- **Question generation:** `utils/quiz` produces multiple-choice questions per topic
  (flag, capital, currency, language, neighbor) plus map questions. Distractors use
  `data/lookalikes.ts` for visually similar flags and pool filtering for plausibility.
- **Spaced repetition:** `utils/spacedRepetition` implements Leitner boxes over
  `progress.review[code:topic]` (box, correct/wrong counts, `nextReviewAt`). The Review
  and Map-review flows pull "due" then "weak" countries.
- **Daily challenge:** `utils/dailyChallenge` builds a fixed 10-question quiz seeded by
  the date, so every player gets the same quiz. Tracks streak/best/history in `progress.daily`.
- **Arcade:** `utils/arcade` — timed/score modes drawing from topic pools.
- **Trivia, Map play/explore, Decks:** additional modes; Decks are user-defined country
  groups (`progress.decks`) practiced like reviews.
- **Determinism:** `utils/seededRandom` (`hashStringToSeed`, `mulberry32`, `seededPick`,
  `seededShuffle`) makes daily and match quizzes reproducible across devices/players.

### Progress model & sync
`types/progress.ts` defines `AppProgress` (xp, coins, streak, completed lessons, selected
topic, `review` map, totals, daily, arcade scores, decks). It is stored:
- **Locally** in `localStorage` via `utils/storage` (always, even anonymous).
- **Remotely** as a single JSONB blob in `public.progress.data` when signed in.

`hooks/useSyncedProgress` is the sync engine:
1. On sign-in it fetches server progress; if this is a new user for this device or an
   anonymous session is being claimed, it **merges** local + server (`utils/progressMerge`),
   otherwise it takes whichever side is newer (by `updated_at`), then upserts the result.
2. Subsequent local mutations debounce (~2s) into a server upsert; sync state surfaces as a
   "Progress saved" / "Sync needs attention" toast.
3. `resetAllProgress` clears local and writes default progress to the server.

XP is also pushed to the `xp-alltime` leaderboard whenever the user has a public-safe
display name (`App.tsx` effect → `submitScore`).

## 4. Supabase data model

Migrations in `supabase/migrations/` (apply in filename order); `supabase/setup.sql` is a
combined idempotent version for the SQL editor. **Every table has RLS enabled.**

| Table | Key | Purpose / notable policies |
|-------|-----|----------------------------|
| `profiles` | `id` = auth user | `display_name` (nullable, never an email). Owner read/write. |
| `progress` | `user_id` | `data jsonb` blob + `updated_at`. Owner-only. |
| `entitlements` | `user_id` | `ads_removed`, `stripe_customer_id`, `purchased_at`. Owner select/insert. |
| `purchases` | `id` | Stripe purchase log. Owner select only (writes via webhook/service role). |
| `leaderboard_scores` | (`user_id`,`board`) | per-board best score + denormalized `display_name`. Owner write, **public read**. Indexed by (`board`, `score desc`). |
| `matches` | `id` | a multiplayer challenge: `created_by`, `seed`, `config jsonb`. **Public read**, owner insert. |
| `match_results` | (`match_id`,`user_id`) | per-player score/total. **Public read**, owner upsert. |
| `friend_links` | (`user_id`,`friend_id`) | directional friend edges. Owner-only (all ops). |

**Functions (RPCs, `security definer`):**
- `top_scores(p_board, p_limit)` → ranked board rows with `is_me`; granted to anon+authenticated.
- `friends_leaderboard()` → aggregates the caller + their friend links over `match_results`
  into rank/wins/total_score (a single winner per match requires a unique top score).
- `handle_new_user()` — `AFTER INSERT` trigger on `auth.users`; seeds `profiles`, `progress`,
  `entitlements` rows. Migration `…0004` changed it so `display_name` falls back to NULL
  (not email) and backfills/scrubs any email-shaped handles already stored — a privacy fix
  so public surfaces never leak PII.

### Auth
Supabase Auth via `AuthProvider` (tracks session + fetches `profiles.display_name`).
Sign-in methods in `SignInModal`: **email/password** account creation and sign-in.
Callback handled at `/auth/callback`. `supabase` client is `null` when env is missing,
in which case the whole app runs local-only and all cloud features no-op gracefully.

## 5. Netlify functions vs Supabase

Two different server surfaces, used for different reasons:

- **Supabase (from the browser, anon key):** all normal reads/writes — progress, leaderboards,
  matches, friends, profiles. Protected by **RLS**, so the anon key is safe to ship.
- **Netlify Functions (privileged, service-role key):** operations that must bypass RLS or
  hold secrets:
  - `delete-account.ts` — **live**. Validates the caller's bearer token, then uses the admin
    client to delete the auth user (cascades remove all their rows). Reachable from Profile;
    required for Play-store/privacy/Reddit trust.
  - `create-checkout-session.ts` / `stripe-webhook.ts` — **deferred** for the free MVP. Create
    a Stripe checkout and, on `checkout.session.completed`, upsert `purchases` + flip
    `entitlements.ads_removed`. Not invoked while `VITE_MONETIZATION_ENABLED=false`.
    `/stripe-webhook` is redirected to the function in `netlify.toml`.

There are no Supabase **edge functions** in this repo — privileged server logic lives in
Netlify functions instead. (`supabase/` contains only SQL migrations + `setup.sql`.)

## 6. Data pipeline (countries & flags)

```
countries.raw.json  ──npm run generate:countries──▶  src/data/countries.ts  ──bundled──▶ app
 (repo root, raw)        (scripts/generateCountries.ts)     (typed Country[])

flag images:  src/data/countries.ts -> flagcdn.com/<cc>.svg  (runtime, SW-cached)
map geometry: src/data/world-110m.json (TopoJSON, bundled)
```

`scripts/generateCountries.ts` filters/normalizes the raw source (valid continent, cca2,
name), assigns difficulty buckets (a hardcoded "easy" list; non-independent/non-UN → "hard"),
maps neighbor cca3 codes to cca2, builds `flagcdn` URLs, and writes the typed array.
Regenerate via `npm run generate:countries` whenever the raw data changes — do not hand-edit
`src/data/countries.ts`.

## 7. Build & deploy pipeline

- **Build:** `npm run build` = `tsc -b` (type-check/project refs) then `vite build` → `dist/`.
  `vite-plugin-pwa` emits the manifest + service worker (autoUpdate; CacheFirst rule for
  `flagcdn.com` flag assets, ~400 entries / 30 days).
- **Env:** `config/env.ts` reads `import.meta.env.VITE_*`, asserts required keys in dev
  (throws), degrades gracefully in prod. `MONETIZATION_ENABLED` and ad-enabled are booleans.
- **Deploy (Netlify):** build `npm run build`, publish `dist`, functions dir `netlify/functions`.
  `netlify.toml` adds the `/stripe-webhook` redirect and the SPA fallback (`/* → /index.html`).
- **DB:** apply the four migrations (or `setup.sql`) to the Supabase project; configure Auth
  for email/password accounts to match `SignInModal`.
- **Tests:** `npm test` (Vitest/jsdom). Game-logic utils, leaderboard/match libs, ads, and the
  stripe-webhook handler have unit tests.

## 8. Extension points

- **New topic:** extend `Topic` in `types/topic.ts`, add a generator in `utils/quiz` (+ to
  `lessonGenerator`/`dailyChallenge`/`matches` topic handling), and surface it in the relevant
  screens.
- **New screen/mode:** add a value to the `Screen` union in `App.tsx`, render it in the switch
  (lazy-load if heavy), and wire navigation (`BottomNav` / Home buttons).
- **New leaderboard:** add a `board` id (see `dailyBoard`/`arcadeBoard`/`xpBoard` in
  `lib/leaderboard.ts`) and call `submitScore`/`fetchTopScores`; no schema change needed
  (board is just a text key).
- **New synced data:** extend `AppProgress` (it's one JSONB blob — no migration), and update
  `defaultProgress` + `utils/progressMerge` so merges stay correct. For relational data instead,
  add a migration + RLS policies mirroring the existing owner-write/public-read patterns.
- **Enable monetization:** set `VITE_MONETIZATION_ENABLED=true` / `VITE_ADS_ENABLED=true`,
  populate the Stripe + AdSense env, and unhide the gated CTAs.
- **Privileged server op:** add a Netlify function using the service-role key and validating the
  caller's Supabase bearer token (follow `delete-account.ts`).
</content>
