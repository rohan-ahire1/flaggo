import * as Sentry from "@sentry/react-native";
import { env } from "../config/env";

export function initSentry() {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    tracesSampleRate: 0.1
  });
}

export { Sentry };
