import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { useGame } from "../state/GameProvider";

export default function ChallengeScreen() {
  const navigate = useNavigate();
  const { createAndShareChallenge } = useGame();
  return (
    <main className="p-5">
      <header>
        <h1 className="screen-title">Challenge</h1>
        <p className="mt-1 text-[15px] font-semibold text-muted">Same round, head to head.</p>
      </header>

      <section className="mt-5 overflow-hidden rounded-[24px] bg-primary p-5 text-white shadow-card-lg">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-paper/15">
          <Icon name="flag" size={26} />
        </div>
        <h2 className="mt-3 font-display text-[28px] font-black leading-tight">Challenge a friend</h2>
        <p className="mt-1 text-[15px] font-semibold text-white/80">
          Send today's exact 5-question round. When you both finish, compare scores.
        </p>
        <button onClick={() => void createAndShareChallenge()} className="mt-5 w-full rounded-2xl bg-paper px-5 py-3.5 font-display text-lg font-black text-primary shadow-card">
          Create &amp; share
        </button>
      </section>

      <section className="mt-6">
        <h2 className="section-label">Standings</h2>
        <div className="mt-3 grid gap-3">
          <LinkRow icon="user" label="Friends" sub="Win-loss with people you've played" onClick={() => navigate("/friends")} />
          <LinkRow icon="trophy" label="Leaderboard" sub="Daily & all-time XP" onClick={() => navigate("/leaderboard")} />
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <h2 className="text-[15px] font-black text-ink">How it works</h2>
        <p className="mt-1 text-[13px] font-semibold leading-6 text-muted">
          1. Create a challenge and share the link.<br />
          2. Your friend opens it - same questions, no login needed to play.<br />
          3. Sign in to save your score and see who won.
        </p>
      </section>
    </main>
  );
}

function LinkRow({ icon, label, sub, onClick }: { icon: IconName; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-[22px] border border-line bg-paper p-4 text-left shadow-card">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface text-primary">
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[17px] font-black text-ink">{label}</span>
        <span className="block text-[13px] font-semibold text-muted">{sub}</span>
      </span>
      <Icon name="chevron" size={22} className="text-muted" />
    </button>
  );
}
