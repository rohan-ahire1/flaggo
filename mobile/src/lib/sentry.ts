export function initSentry() {
  // Web runs without Sentry until a browser package is added intentionally.
}

export const Sentry = {
  captureException: (_error: unknown) => undefined
};
