import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate("/", { replace: true });
      return;
    }
    supabase.auth.getSession().finally(() => navigate("/", { replace: true }));
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-flaggo-bg p-5">
      <section className="flaggo-card p-6 text-center">
        <h1 className="font-display text-2xl font-black">Signing you in...</h1>
        <p className="mt-2 font-bold text-flaggo-muted">Your progress sync will start in a moment.</p>
      </section>
    </main>
  );
}
