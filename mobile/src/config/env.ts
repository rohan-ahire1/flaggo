import Constants from "expo-constants";
import { BRAND } from "./brand";

// Mobile client env. On web this came from Vite's import.meta.env; in Expo it
// comes from app.json's `extra` block (readable via expo-constants) with an
// optional process.env override for local dev / EAS secrets.
type ClientEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  sentryDsn: string;
  siteUrl: string;
  monetizationEnabled: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function read(extraKey: string, envKey: string): string {
  const fromEnv = process.env[envKey];
  if (fromEnv) return String(fromEnv);
  const fromExtra = extra[extraKey];
  return fromExtra ? String(fromExtra) : "";
}

export const env: ClientEnv = {
  supabaseUrl: read("supabaseUrl", "EXPO_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("supabaseAnonKey", "EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  sentryDsn: read("sentryDsn", "EXPO_PUBLIC_SENTRY_DSN"),
  siteUrl: read("siteUrl", "EXPO_PUBLIC_SITE_URL") || BRAND.url,
  monetizationEnabled:
    read("monetizationEnabled", "EXPO_PUBLIC_MONETIZATION_ENABLED").toLowerCase() === "true"
};

export const MONETIZATION_ENABLED = env.monetizationEnabled;
