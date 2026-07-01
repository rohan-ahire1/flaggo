import { BRAND } from "./brand";

type ClientEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublishableKey: string;
  adsenseClientId: string;
  plausibleDomain: string;
  sentryDsn: string;
  siteUrl: string;
  adsEnabled: boolean;
  monetizationEnabled: boolean;
};

// All recognized client env keys.
type EnvKey =
  | "VITE_SUPABASE_URL"
  | "VITE_SUPABASE_ANON_KEY"
  | "VITE_STRIPE_PUBLISHABLE_KEY"
  | "VITE_ADSENSE_CLIENT_ID"
  | "VITE_PLAUSIBLE_DOMAIN"
  | "VITE_SENTRY_DSN"
  | "VITE_SITE_URL"
  | "VITE_ADS_ENABLED"
  | "VITE_MONETIZATION_ENABLED";

// Only these are required to boot the free MVP. Stripe, Sentry, AdSense, and
// Plausible are feature-flagged/init-only-when-present.
const requiredKeys = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SITE_URL"
] as const;

function read(key: EnvKey): string {
  return String(import.meta.env[key] ?? "");
}

function readBoolean(key: EnvKey): boolean {
  return read(key).toLowerCase() === "true";
}

const missing = requiredKeys.filter((key) => !read(key));

export function assertClientEnv(keys: readonly string[], isDev: boolean) {
  if (isDev && keys.length) {
    throw new Error(`Missing ${BRAND.name} env vars: ${keys.join(", ")}`);
  }
}

if (import.meta.env.MODE !== "test") {
  assertClientEnv(missing, Boolean(import.meta.env.DEV));
}

export const env: ClientEnv = {
  supabaseUrl: read("VITE_SUPABASE_URL"),
  supabaseAnonKey: read("VITE_SUPABASE_ANON_KEY"),
  stripePublishableKey: read("VITE_STRIPE_PUBLISHABLE_KEY"),
  adsenseClientId: read("VITE_ADSENSE_CLIENT_ID"),
  plausibleDomain: read("VITE_PLAUSIBLE_DOMAIN"),
  sentryDsn: read("VITE_SENTRY_DSN"),
  siteUrl: read("VITE_SITE_URL") || window.location.origin,
  adsEnabled: readBoolean("VITE_ADS_ENABLED"),
  monetizationEnabled: readBoolean("VITE_MONETIZATION_ENABLED")
};

export const MONETIZATION_ENABLED = env.monetizationEnabled;

export function getMissingClientEnv() {
  return missing;
}
