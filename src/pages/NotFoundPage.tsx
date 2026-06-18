import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-flaggo-bg p-5">
      <section className="flaggo-card max-w-sm p-6 text-center">
        <h1 className="font-display text-3xl font-black">Page not found</h1>
        <p className="mt-2 font-bold text-flaggo-muted">That route is not part of Flaggo.</p>
        <Link to="/" className="flaggo-button mt-5 inline-block bg-green-grad text-white shadow-button-green">Go home</Link>
      </section>
    </main>
  );
}
