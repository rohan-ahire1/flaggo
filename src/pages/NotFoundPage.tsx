import { Link } from "react-router-dom";
import { BRAND } from "../config/brand";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper p-5">
      <section className="rounded-[24px] border border-line bg-paper shadow-card max-w-sm p-6 text-center">
        <h1 className="font-display text-3xl font-black">Page not found</h1>
        <p className="mt-2 font-bold text-muted">That route is not part of {BRAND.name}.</p>
        <Link to="/" className="btn-primary mt-5 inline-block bg-primary text-white shadow-button">Go home</Link>
      </section>
    </main>
  );
}
