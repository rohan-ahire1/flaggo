import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useEntitlement } from "../hooks/useEntitlement";
import { trackEvent } from "../lib/analytics";

export function ProSuccessPage() {
  const { adsRemoved, refetch } = useEntitlement();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let count = 0;
    const id = window.setInterval(async () => {
      count += 1;
      const ready = await refetch();
      if (ready || count > 8) {
        if (ready) trackEvent("purchase-complete");
        setChecking(false);
        window.clearInterval(id);
      }
    }, 1500);
    return () => window.clearInterval(id);
  }, [refetch]);

  return (
    <main className="grid min-h-screen place-items-center bg-hero-sky p-5">
      <section className="flaggo-card max-w-sm p-6 text-center">
        <h1 className="font-display text-3xl font-black">{adsRemoved ? "Flaggo Pro is active" : "Payment received"}</h1>
        <p className="mt-2 font-bold text-flaggo-muted">
          {checking && !adsRemoved ? "Confirming your ad-free upgrade..." : "Ads are removed for this account on every device you sign into."}
        </p>
        <Link to="/" className="flaggo-button mt-5 inline-block bg-green-grad text-white shadow-button-green">Back to Flaggo</Link>
      </section>
    </main>
  );
}

export function ProCancelPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-flaggo-bg p-5">
      <section className="flaggo-card max-w-sm p-6 text-center">
        <h1 className="font-display text-3xl font-black">Checkout canceled</h1>
        <p className="mt-2 font-bold text-flaggo-muted">No charge was made. You can keep using Flaggo for free.</p>
        <Link to="/" className="flaggo-button mt-5 inline-block bg-green-grad text-white shadow-button-green">Back to Flaggo</Link>
      </section>
    </main>
  );
}
