import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { DAILY_QUESTION_COUNT, dateKey } from "@flaggo/core/utils/dailyChallenge";
import {
  PROGRESSIVE_STAGE_LABELS,
  PROGRESSIVE_STAGES,
  PROGRESSIVE_TIER_SIZE,
  progressiveResults
} from "@flaggo/core/utils/progressivePractice";
import { useGame } from "../state/GameProvider";

export default function HomeScreen() {
  const navigate = useNavigate();
  const { countries, progress } = useGame();
  const todayKey = dateKey();
  const dailyResult = progress.daily.history[todayKey];

  const learning = progressiveResults(progress, countries);
  const stageIndex = PROGRESSIVE_STAGES.indexOf(learning.stage);
  const learningTotal = PROGRESSIVE_STAGES.length * PROGRESSIVE_TIER_SIZE;
  const introducedPercent = Math.round((learning.seen / learningTotal) * 100);
  const isNewLearner = learning.seen === 0;

  const moreModes: { label: string; desc: string; icon: IconName; onClick: () => void }[] = [
    { label: "Challenge modes", desc: "120s timed or three strikes", icon: "bolt", onClick: () => navigate("/arcade?mode=timed") },
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
          <p className="mt-1 text-sm font-medium text-muted">Four focused stages. Smart repetition. Lasting recall.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-[22px] border border-line bg-surface px-3.5 py-1.5 text-[17px] font-bold text-accent">
          <Icon name="flame" size={17} />
          {progress.streak}
        </div>
      </header>

      <section className="relative mb-4 overflow-hidden rounded-[26px] bg-primary p-5 text-white shadow-card-lg">
        <span className="wl-dots absolute inset-0 opacity-90" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/75">{isNewLearner ? "Start here" : "Current stage"}</p>
          <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight">
            {PROGRESSIVE_STAGE_LABELS[learning.stage]}
          </h2>
          <p className="mt-1 text-sm font-semibold text-white/80">
            Flags {stageIndex * PROGRESSIVE_TIER_SIZE + 1}–{(stageIndex + 1) * PROGRESSIVE_TIER_SIZE} · mistakes repeat until they stick
          </p>
          <button onClick={() => navigate("/arcade?mode=progressive&start=1")} className="btn-inverse mt-5 w-full">
            <Icon name="learn" size={19} /> {isNewLearner ? "Start learning" : "Continue learning"}
          </button>

          <div className="mt-5 border-t border-white/20 pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="font-display text-3xl font-semibold">{learning.seen}</span>
                <span className="text-sm font-bold text-white/75"> / {learningTotal} introduced</span>
              </div>
              <span className="text-sm font-bold text-white/80">{learning.mastered} mastered</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${introducedPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

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

      <button
        disabled
        className="mb-6 flex w-full cursor-not-allowed items-center gap-3 rounded-[20px] bg-gradient-to-r from-sky-400 to-indigo-400 p-4 text-left text-white opacity-80 shadow-card-lg"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl">🧒</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="block font-display text-lg font-semibold">Kids Mode</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]">
              Coming soon
            </span>
          </span>
          <span className="block text-[13px] font-medium text-white/85">Big flags, sounds & stickers for ages 3–8</span>
        </span>
      </button>

      <h2 className="mb-2.5 font-display text-xl font-semibold text-ink">More ways to play</h2>
      <div className="grid grid-cols-2 gap-3">
        {moreModes.map((item, index) => (
          <Tile key={item.label} {...item} wide={moreModes.length % 2 === 1 && index === moreModes.length - 1} />
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
