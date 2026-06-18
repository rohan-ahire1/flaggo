import { env } from "../config/env";

let injected = false;

export function loadAdsense() {
  if (injected || !env.adsenseClientId) return;
  injected = true;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(env.adsenseClientId)}`;
  document.head.appendChild(script);
}
