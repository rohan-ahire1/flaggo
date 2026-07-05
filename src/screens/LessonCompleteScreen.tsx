import Icon from "../components/Icon";
import type { Topic } from "@flaggo/core/types/topic";

export type LessonResult = {
  xpEarned: number;
  accuracy: number;
  correct: number;
  total: number;
  streak: number;
  coinsEarned: number;
  topic: Topic;
};

const CONFETTI = ["#58CC02", "#1CB0F6", "#FFC800", "#FF9600", "#CE82FF", "#FF4B4B"];

export default function LessonCompleteScreen({ result, onContinueLearning, onBackHome, adSlot }: { result: LessonResult; onContinueLearning: () => void; onBackHome: () => void; adSlot?: React.ReactNode }) {
  const perfect = result.correct === result.total;
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-hero-sky p-5">
      {/* Confetti burst */}
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-0 max-w-md">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-0 h-2.5 w-2.5 rounded-[2px] animate-confetti"
            style={{
              left: `${(i * 5.5 + 4) % 100}%`,
              background: CONFETTI[i % CONFETTI.length],
              animationDelay: `${(i % 6) * 90}ms`
            }}
          />
        ))}
      </div>

      <section className="flaggo-card w-full animate-pop-in p-7 text-center">
        <div className="mx-auto mb-5 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-flaggo-yellow to-flaggo-orange text-white shadow-[0_8px_0_rgba(255,150,0,0.4)]">
          <Icon name="trophy" size={48} />
        </div>
        <h1 className="screen-title">Lesson Complete!</h1>
        {perfect && (
          <p className="mt-1 inline-flex items-center gap-1 font-display font-extrabold text-flaggo-orange">
            <Icon name="star" size={16} /> Perfect lesson!
          </p>
        )}

        <div className="my-6 rounded-[24px] bg-gradient-to-br from-green-50 to-flaggo-bg p-5">
          <div className="flex animate-xp-pop items-center justify-center gap-2 font-display text-5xl font-black text-flaggo-green">
            <Icon name="bolt" size={40} />+{result.xpEarned}
          </div>
          <div className="mt-1 text-lg font-bold text-flaggo-muted">XP earned</div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <Stat icon="target" label="Accuracy" value={`${result.accuracy}%`} tone="text-flaggo-blue" />
          <Stat icon="check" label="Correct" value={`${result.correct}/${result.total}`} tone="text-flaggo-green" />
          <Stat icon="flame" label="Streak" value={`${result.streak} days`} tone="text-flaggo-orange" />
          <Stat icon="coin" label="Coins" value={`+${result.coinsEarned}`} tone="text-flaggo-yellow" />
        </div>

        <button onClick={onContinueLearning} className="flaggo-button mt-6 w-full bg-green-grad text-white shadow-button-green">
          Continue learning
        </button>
        <button onClick={onBackHome} className="btn-secondary mt-3 w-full">
          Back to Today
        </button>
        {adSlot}
      </section>
    </main>
  );
}

function Stat({ icon, label, value, tone }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-flaggo-border bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-flaggo-muted">
        <Icon name={icon} size={14} className={tone} /> {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-black ${tone}`}>{value}</div>
    </div>
  );
}
