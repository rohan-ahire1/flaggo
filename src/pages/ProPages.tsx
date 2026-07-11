import { Link } from "react-router-dom";
import { BRAND } from "../config/brand";

export function ProSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-hero-sky p-5">
      <section className="rounded-[24px] border border-line bg-paper shadow-card max-w-sm p-6 text-center">
        <h1 className="font-display text-3xl font-black">{BRAND.name} is free to use</h1>
        <p className="mt-2 font-bold text-muted">This page is currently inactive.</p>
        <Link to="/" className="btn-primary mt-5">Back to {BRAND.name}</Link>
      </section>
    </main>
  );
}

export function ProCancelPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper p-5">
      <section className="rounded-[24px] border border-line bg-paper shadow-card max-w-sm p-6 text-center">
        <h1 className="font-display text-3xl font-black">{BRAND.name} is free to use</h1>
        <p className="mt-2 font-bold text-muted">This page is currently inactive.</p>
        <Link to="/" className="btn-primary mt-5">Back to {BRAND.name}</Link>
      </section>
    </main>
  );
}
