import * as Sentry from "@sentry/react";
import { env } from "../config/env";

export function initSentry() {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1
  });
}

export { Sentry };
