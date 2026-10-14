# Production Setup

This project ships as two clients backed by one Supabase project:

- Mobile app: Expo/React Native, released through Play Console.
- Web app: root Vite app, self-hosted on the VPS with its API (`server/`).

## 1. Supabase Project

Create one Supabase project and apply these migrations in order:

1. `supabase/migrations/202606180001_flaggo_v1.sql`
2. `supabase/migrations/202606180002_leaderboards.sql`
3. `supabase/migrations/202606180003_matches.sql`
4. `supabase/migrations/202606180004_handle_no_email.sql`

Required Supabase Auth providers:

- Email/password

Required redirect URLs before launch:

```text
http://localhost:5173/auth/callback
https://flaggo.rohanahire.com/auth/callback
flaggo://auth/callback
```

Add the final domain later when it exists:

```text
https://playflaggo.com/auth/callback
```

Google sign-in is intentionally hidden until a custom auth domain is available.

## 2. Web App Deploy (VPS)

Production is https://flaggo.rohanahire.com on the VPS. The pieces live in `deploy/`:

- `vps-deploy.sh` → installed as `/usr/local/sbin/flaggo-deploy`. Fetches `origin/main` and,
  when it moved, builds as the unprivileged `flaggo-build` user (clone in
  `/var/lib/flaggo-build/flaggo`, read-only GitHub deploy key), copies `dist/` to
  `/var/www/flaggo.rohanahire.com`, installs the API bundle to `/opt/flaggo-api`, and restarts
  the API. `flaggo-deploy --force` redeploys the current commit. Root runs the installed
  copy, so re-install it by hand after changing the script.
- `flaggo-deploy.service` + `.timer` → run the deploy every 5 minutes. Logs:
  `journalctl -u flaggo-deploy`.
- `flaggo-api.service` → the API on `127.0.0.1:8796`, as the `flaggo-api` user.
- `setup-vps.sh` → one-time setup, run from the Mac after merging: `bash deploy/setup-vps.sh`.
- `Caddyfile` → the site block: `/api/*` and `/stripe-webhook` go to the API, everything else
  is the static app with SPA fallback.

Build env, `/etc/flaggo/build.env` (public values only):

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_URL=https://flaggo.rohanahire.com
VITE_ADS_ENABLED=false
VITE_MONETIZATION_ENABLED=false
```

API secrets, `/etc/flaggo/api.env` (root:flaggo-api, 0640):

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=https://flaggo.rohanahire.com
# Only when monetization is on:
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

GitHub Actions only runs CI (tests and builds); it does not deploy. Use Node 22+.

## 3. Mobile App Setup

Mobile env vars:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SITE_URL=
EXPO_PUBLIC_MONETIZATION_ENABLED=false
```

Before Play Store release, finalize:

- App display name
- Android package name
- URL scheme
- Play Console signing setup
- Supabase redirect URL for the app scheme

## 4. Server Functions

These are needed for username-only signup, account deletion, checkout, and webhook flows:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

Keep service-role and Stripe secrets server-only. Never expose them with a `VITE_` or `EXPO_PUBLIC_` prefix.

## 5. Smoke Test

Before launch, verify:

- New user can create an account with email/password on web.
- Existing user can sign in with email/password on web.
- New user can create an account with email/password on Android.
- Existing user can sign in with email/password on Android.
- Signed-out progress merges into the account after first login.
- Progress syncs from web to mobile and mobile to web.
- Sign out keeps local app usable.
- Account deletion works only when server env vars are configured.
- Leaderboards and match sharing do not expose email addresses.
