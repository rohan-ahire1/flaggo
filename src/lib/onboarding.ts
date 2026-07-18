const ONBOARDING_COMPLETE_KEY = "flaggo-onboarding-complete";

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function hasCompletedOnboarding() {
  return getStorage()?.getItem(ONBOARDING_COMPLETE_KEY) === "true";
}

export function completeOnboarding() {
  getStorage()?.setItem(ONBOARDING_COMPLETE_KEY, "true");
}

export function resetOnboarding() {
  getStorage()?.removeItem(ONBOARDING_COMPLETE_KEY);
}
