import { Link } from "react-router-dom";
import { BRAND } from "../config/brand";

export function ProSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-hero-sky p-5">
      <section className="flaggo-card max-w-sm p-6 text-center">
        <h1 className="font-display text-3xl font-black">{BRAND.name} is free to use</h1>
        <p className="mt-2 font-bold text-flaggo-muted">This page is currently inactive.</p>
        <Link to="/" className="flaggo-button mt-5 inline-block bg-green-grad text-white shadow-button-green">Back to {BRAND.name}</Link>
      </section>
    </main>
  );
}

export function ProCancelPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-flaggo-bg p-5">
      <section className="flaggo-card max-w-sm p-6 text-center">
        <h1 className="font-display text-3xl font-black">{BRAND.name} is free to use</h1>
        <p className="mt-2 font-bold text-flaggo-muted">This page is currently inactive.</p>
        <Link to="/" className="flaggo-button mt-5 inline-block bg-green-grad text-white shadow-button-green">Back to {BRAND.name}</Link>
      </section>
    </main>
  );
}
