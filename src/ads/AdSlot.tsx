import { useEffect } from "react";
import { env } from "../config/env";
import { loadAdsense } from "./adsense";
import type { AdConsent } from "./consent";

type Props = {
  consent: AdConsent;
  adsRemoved: boolean;
  slot?: string;
  prompt?: React.ReactNode;
};

export default function AdSlot({ consent, adsRemoved, slot = "0000000000", prompt }: Props) {
  const eligible = env.adsEnabled && consent === "granted" && !adsRemoved;

  useEffect(() => {
    if (eligible) loadAdsense();
  }, [eligible]);

  if (adsRemoved || consent !== "granted" || !env.adsEnabled) return null;

  return (
    <aside className="mx-5 my-5 rounded-[18px] border border-dashed border-line bg-paper p-3 text-center shadow-card">
      <ins
        className="adsbygoogle block min-h-20"
        data-ad-client={env.adsenseClientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <div className="mt-2 text-xs font-bold text-muted">{prompt ?? "Ad space supports free flag learning."}</div>
    </aside>
  );
}
