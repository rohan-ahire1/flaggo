import Icon from "../components/Icon";
import { BRAND } from "../config/brand";

// Cold open — a no-login first session. One primary action: start the first guided lesson.
import { useNavigate } from "react-router-dom";
import { useGame } from "../state/GameProvider";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { startLearning } = useGame();
  return (
    <main className="grid min-h-screen place-items-center bg-paper p-8">
      <section className="flex w-full max-w-sm animate-pop-in flex-col items-center gap-6 text-center">
        <div className="relative grid h-[164px] w-[164px] place-items-center overflow-hidden rounded-full bg-primary shadow-card-lg">
          <span className="wl-dots absolute inset-0" />
          <Icon name="globe" size={92} className="relative text-white opacity-95" strokeWidth={1.4} />
        </div>

        <div>
          <h1 className="font-display text-[44px] font-semibold leading-none text-ink">{BRAND.name}</h1>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.06em] text-accent">
            Learn the world, one lesson at a time
          </p>
        </div>

        <p className="text-balance text-[19px] font-medium leading-snug text-ink">
          Guided lessons take you region by region — flags, capitals, and how they all fit together.
        </p>

        <button
          onClick={() => startLearning("flag")}
          className="w-full rounded-2xl bg-primary py-4 font-display text-xl font-semibold text-white shadow-card-lg transition active:translate-y-0.5"
        >
          Start learning →
        </button>
        <p className="text-[15px] font-medium text-muted">no sign-up · about 2 minutes</p>
        <button onClick={() => navigate("/daily")} className="text-[15px] font-bold text-primary underline">
          Try today's challenge
        </button>
      </section>
    </main>
  );
}
