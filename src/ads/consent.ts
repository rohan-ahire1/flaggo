const KEY = "flaggo-ad-consent";

export type AdConsent = "granted" | "declined" | "unset";

export function getAdConsent(): AdConsent {
  const value = localStorage.getItem(KEY);
  if (value === "granted" || value === "declined") return value;
  return "unset";
}

export function setAdConsent(value: Exclude<AdConsent, "unset">) {
  localStorage.setItem(KEY, value);
}
