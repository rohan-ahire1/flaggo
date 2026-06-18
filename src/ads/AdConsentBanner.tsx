import { useEffect, useState } from "react";
import { getAdConsent, setAdConsent, type AdConsent } from "./consent";
import { trackEvent } from "../lib/analytics";

export default function AdConsentBanner({ onChange }: { onChange: (consent: AdConsent) => void }) {
  const [consent, setConsent] = useState<AdConsent>(() => getAdConsent());

  useEffect(() => {
    onChange(consent);
  }, [consent, onChange]);

  if (consent !== "unset") return null;

  function choose(value: "granted" | "declined") {
    setAdConsent(value);
    setConsent(value);
    if (value === "granted") trackEvent("ad-consent-granted");
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md p-3">
      <section className="rounded-[22px] border border-flaggo-border bg-white p-4 shadow-soft">
        <h2 className="font-display text-lg font-black">Ads consent</h2>
        <p className="mt-1 text-sm font-bold text-flaggo-muted">
          Flaggo uses Google AdSense to support the free app. Ads only load if you allow ad cookies and personalized ad storage.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => choose("declined")} className="flaggo-button bg-white text-flaggo-text shadow-card">
            Decline
          </button>
          <button onClick={() => choose("granted")} className="flaggo-button bg-green-grad text-white shadow-button-green">
            Allow ads
          </button>
        </div>
      </section>
    </div>
  );
}
