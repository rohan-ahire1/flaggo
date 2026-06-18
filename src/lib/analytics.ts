import { env } from "../config/env";

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

let loaded = false;

export function loadPlausible() {
  if (loaded || !env.plausibleDomain) return;
  loaded = true;
  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = env.plausibleDomain;
  script.src = "https://plausible.io/js/script.js";
  document.head.appendChild(script);
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  window.plausible?.(name, props ? { props } : undefined);
}
