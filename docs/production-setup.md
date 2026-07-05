# Production Setup

This project ships as two clients backed by one Supabase project:

- Mobile app: Expo/React Native, released through Play Console.
- Web app: root Vite app, deployed separately to a static host.

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
https://<web-host-subdomain>/auth/callback
flaggo://auth/callback
```

Add the final domain later when it exists:

```text
https://playflaggo.com/auth/callback
```

Google sign-in is intentionally hidden until a custom auth domain is available.

## 2. Web App Deploy

The root app is the web app.

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

Required web env vars:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_URL=
VITE_ADS_ENABLED=false
VITE_MONETIZATION_ENABLED=false
```

If deploying with the included GitHub Actions workflow, create these repository secrets:

```text
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SITE_URL
```

Use Node 22 for local and CI builds.

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
