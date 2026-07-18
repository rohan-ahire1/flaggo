import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { DAILY_QUESTION_COUNT } from "@flaggo/core/utils/dailyChallenge";
import { progressiveResults, type ProgressiveStage } from "@flaggo/core/utils/progressivePractice";
import { useGame } from "../state/GameProvider";

const STAGE_LABEL: Record<ProgressiveStage, string> = { easy: "easy", medium: "medium", hard: "hard" };

export default function HomeScreen() {
  const navigate = useNavigate();
  const { countries, progress } = useGame();
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyResult = progress.daily.history[todayKey];

  const learning = progressiveResults(progress, countries);
  const introducedPercent = countries.length ? Math.round((learning.seen / countries.length) * 100) : 0;
  const isNewUser = learning.seen === 0;

  const nextAction = isNewUser
    ? {
        label: "Start here",
        title: "Learn your first flags",
        sub: "Start with easier flags and repeat mistakes until they stick.",
        cta: "Start progressive learning"
      }
    : {
        label: "Progressive learning",
        title: `Continue with ${STAGE_LABEL[learning.stage]} flags`,
        sub: learning.needsRepetition
          ? `${learning.needsRepetition} ${learning.needsRepetition === 1 ? "flag needs" : "flags need"} repetition alongside new material.`
          : "Keep introducing new flags at your current stage.",
        cta: "Continue learning"
      };

  const moreModes: { label: string; desc: string; icon: IconName; onClick: () => void }[] = [
    { label: "Challenge modes", desc: "120s timed or three strikes", icon: "bolt", onClick: () => navigate("/arcade?mode=timed") },
    { label: "World map", desc: "Find countries", icon: "globe", onClick: () => navigate("/map") },
    { label: "Trivia", desc: "Quick-fire facts", icon: "sparkle", onClick: () => navigate("/trivia") },
    { label: "Custom test", desc: "Choose your challenge", icon: "target", onClick: () => navigate("/test-setup") },
    { label: "Decks", desc: "Build practice sets", icon: "star", onClick: () => navigate("/decks") }
  ];

  return (
    <div className="px-5 pb-5 pt-5">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Your world flag journey</p>
          <h1 className="screen-title mt-1">Learn every flag</h1>
          <p className="mt-1 text-sm font-medium text-muted">One small lesson. Smart reviews. Lasting recall.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-[22px] border border-line bg-surface px-3.5 py-1.5 text-[17px] font-bold text-accent">
          <Icon name="flame" size={17} />
          {progress.streak}
        </div>
      </header>

      <section className="relative mb-4 overflow-hidden rounded-[26px] bg-primary p-5 text-white shadow-card-lg">
        <span className="wl-dots absolute inset-0 opacity-90" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/75">{nextAction.label}</p>
          <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight">{nextAction.title}</h2>
          <p className="mt-1 text-sm font-semibold text-white/80">{nextAction.sub}</p>
          <button onClick={() => navigate("/arcade?mode=progressive&start=1")} className="btn-inverse mt-5 w-full">
            <Icon name="learn" size={19} /> {nextAction.cta}
          </button>

          <div className="mt-5 border-t border-white/20 pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="font-display text-3xl font-semibold">{learning.seen}</span>
                <span className="text-sm font-bold text-white/75"> / {countries.length} introduced</span>
              </div>
              <span className="text-sm font-bold text-white/80">{learning.mastered} mastered</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${introducedPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/learn")} className="rounded-[18px] border border-line bg-paper p-3.5 text-left shadow-card">
          <Icon name="book" size={22} className="text-primary" />
          <span className="mt-2 block font-semibold text-ink">Flag lessons</span>
          <span className="block text-[13px] font-medium text-muted">Choose a region</span>
        </button>
        <button onClick={() => navigate("/arcade?mode=progressive&tab=results")} className="rounded-[18px] border border-line bg-paper p-3.5 text-left shadow-card">
          <Icon name="stats" size={22} className="text-primary" />
          <span className="mt-2 block font-semibold text-ink">Learning results</span>
          <span className="block text-[13px] font-medium text-muted">Progress by difficulty</span>
        </button>
      </div>

      <button
        onClick={() => navigate("/daily")}
        className="mb-6 flex w-full items-center gap-3 rounded-[20px] border border-line bg-surface p-4 text-left shadow-card"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accentDeep">
          <Icon name="today" size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold text-ink">Daily challenge</span>
          <span className="block text-[13px] font-medium text-muted">
            {dailyResult ? `${dailyResult.score}/${dailyResult.total} today · play again` : `${DAILY_QUESTION_COUNT} mixed questions · about 90 seconds`}
          </span>
        </span>
        <Icon name="chevron" size={18} className="shrink-0 text-muted" />
      </button>

      <h2 className="mb-2.5 font-display text-xl font-semibold text-ink">More ways to play</h2>
      <div className="grid grid-cols-2 gap-3">
        {moreModes.map((item, index) => (
          <Tile key={item.label} {...item} wide={index === moreModes.length - 1} />
        ))}
      </div>
    </div>
  );
}

function Tile({ label, desc, icon, onClick, wide = false }: { label: string; desc: string; icon: IconName; onClick: () => void; wide?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-[18px] border border-line bg-paper p-3.5 text-left shadow-card ${wide ? "col-span-2" : ""}`}>
      <Icon name={icon} size={22} className="text-primary" />
      <span className="mt-2 block font-semibold text-ink">{label}</span>
      <span className="block text-[13px] font-medium text-muted">{desc}</span>
    </button>
  );
}
