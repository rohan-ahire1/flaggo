import type * as SentryTypes from "@sentry/react";
import { env } from "../config/env";

let sentry: typeof SentryTypes | null = null;

// Loaded on demand so the SDK stays out of the main bundle when no DSN is set.
export function initSentry() {
  if (!env.sentryDsn) return;
  void import("@sentry/react").then((Sentry) => {
    sentry = Sentry;
    Sentry.init({
      dsn: env.sentryDsn,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1
    });
  });
}

export function captureException(error: unknown) {
  sentry?.captureException(error);
}
