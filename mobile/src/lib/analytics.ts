// Analytics is deferred on mobile (PostHog is the planned post-MVP choice).
// These are no-op shims so callers copied from web keep compiling.

export function loadPlausible() {
  // no-op on mobile
}

export function trackEvent(_name: string, _props?: Record<string, string | number | boolean>) {
  // no-op on mobile
}
