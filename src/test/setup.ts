import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "pk_test_flaggo");
vi.stubEnv("VITE_ADSENSE_CLIENT_ID", "ca-pub-0000000000000000");
vi.stubEnv("VITE_PLAUSIBLE_DOMAIN", "worldly.app");
vi.stubEnv("VITE_SENTRY_DSN", "https://example@sentry.io/1");
vi.stubEnv("VITE_SITE_URL", "https://worldly.app");
vi.stubEnv("VITE_ADS_ENABLED", "false");
