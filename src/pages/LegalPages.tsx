import { Link } from "react-router-dom";
import { BRAND } from "../config/brand";

const contact = "support@playflaggo.netlify.app";

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <Link to="/" className="font-display font-black text-flaggo-green">{BRAND.name}</Link>
      <article className="mt-5 rounded-[24px] border border-flaggo-border bg-white p-6 shadow-card">
        <h1 className="font-display text-3xl font-black">{title}</h1>
        <div className="prose prose-slate mt-5 max-w-none space-y-4 text-sm font-semibold leading-6 text-flaggo-text">{children}</div>
      </article>
    </main>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>{BRAND.name} stores learning progress so you can practice geography trivia and, when signed in, sync progress across devices.</p>
      <p>Account data is handled by Supabase Auth. If you sign in with Google or email magic link, {BRAND.name} receives basic account identifiers such as your email address and Supabase user ID.</p>
      <p>Progress is stored locally in your browser and, for signed-in users, in Supabase as a JSON progress record.</p>
      <p>If you opt into leaderboards, your chosen display name and submitted score are publicly visible. Your email address and account ID are never shown in leaderboard results.</p>
      <p>Ads are currently disabled. If ads return later, {BRAND.name} will only load Google AdSense after consent, including cookies or similar technologies for ad measurement and personalization. Plausible analytics records privacy-friendly product events without personal identifiers. Sentry may receive error diagnostics when configured.</p>
      <p>You can request data deletion or privacy help at {contact}. You can also delete your account and learning data from the Profile screen when signed in.</p>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>{BRAND.name} is a web learning app for practicing world geography trivia. You may use the free app for personal learning, subject to normal fair use and applicable law.</p>
      <p>The app is provided as-is. We work to keep progress safe and the service available, but we cannot guarantee uninterrupted availability or error-free content.</p>
      <p>Do not misuse the service, interfere with account systems, or attempt to access another person&apos;s data. For support, contact {contact}.</p>
    </LegalLayout>
  );
}
