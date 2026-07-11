import React from "react";
import ReactDOM from "react-dom/client";
import AppShell from "./AppShell";
import "./index.css";
import { BRAND } from "./config/brand";
import { initSentry, Sentry } from "./lib/sentry";

initSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <AppShell />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

function ErrorFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper p-5">
      <section className="rounded-[24px] border border-line bg-paper shadow-card max-w-sm p-6 text-center">
        <h1 className="font-display text-2xl font-black">Something went wrong</h1>
        <p className="mt-2 font-bold text-muted">Reload {BRAND.name} to get back to learning.</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-5">
          Reload
        </button>
      </section>
    </main>
  );
}
