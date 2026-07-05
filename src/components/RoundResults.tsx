import FlagImage from "./FlagImage";
import Icon, { type IconName } from "./Icon";
import ScoreRing from "./ScoreRing";

export type RoundResultItem = {
  label: string;
  correct: boolean;
  chosen?: string;
  answer?: string;
  countryCode?: string;
  countryName?: string;
  flagUrl?: string;
  context?: string;
};

export type ResultAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  icon?: IconName;
};

const confettiColors = [
  "rgb(var(--primary))",
  "rgb(var(--accent))",
  "rgb(var(--success))",
  "rgb(var(--error))",
  "rgb(var(--primary-dark))",
  "rgb(var(--muted))"
];

function title(score: number, total: number) {
  if (total > 0 && score === total) return "Perfect round!";
  if (score / Math.max(1, total) >= 0.5) return "Great round!";
  return "Keep practising!";
}

export default function RoundResults({
  score,
  total,
  items,
  streak,
  caption,
  actions
}: {
  score: number;
  total: number;
  items: RoundResultItem[];
  streak?: number;
  caption?: string;
  actions: ResultAction[];
}) {
  const missed = items.filter((item) => !item.correct);
  return (
    <main className="relative flex min-h-screen flex-col bg-paper p-5">
      {score === total && total > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-10 mx-auto h-60 max-w-md overflow-hidden md:max-w-2xl lg:max-w-3xl">
          {Array.from({ length: 28 }).map((_, index) => (
            <span
              key={index}
              className="absolute top-0 h-3 w-2 animate-confetti rounded-sm"
              style={{
                left: `${(index * 37) % 100}%`,
                background: confettiColors[index % confettiColors.length],
                animationDelay: `${(index % 8) * 90}ms`,
                transform: `rotate(${index * 19}deg)`
              }}
            />
          ))}
        </div>
      ) : null}

      <section className="grid justify-items-center gap-2 pt-2 text-center">
        <p className="section-label">Round complete</p>
        <h1 className="screen-title">{title(score, total)}</h1>
        <ScoreRing score={score} total={total} caption={caption} />
      </section>

      {typeof streak === "number" ? (
        <section className="mt-4 flex items-center gap-3 rounded-[22px] border border-line bg-paper p-4 shadow-card">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/20 text-accent"><Icon name="flame" size={20} /></span>
          <p className="font-display text-[17px] font-semibold text-ink">{streak} day streak <span className="font-sans text-sm font-semibold text-muted">+1 today</span></p>
        </section>
      ) : null}

      <section className="mt-3 flex items-center gap-3 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <span className={`grid h-10 w-10 place-items-center rounded-full ${missed.length ? "bg-accent/20 text-accent" : "bg-success/20 text-success"}`}>
          <Icon name={missed.length ? "target" : "check"} size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[17px] font-semibold text-ink">{missed.length ? `${missed.length} to review next` : "No misses to review"}</p>
          <p className="text-sm font-semibold text-muted">{missed.length ? "Your review queue now knows what to bring back." : "Keep the streak alive with another short round."}</p>
        </div>
      </section>

      <section className="mt-3 min-h-0 flex-1 overflow-hidden rounded-[22px] border border-line bg-paper shadow-card">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="section-label">Review</p>
          <p className="text-sm font-bold text-muted">{score}/{total} correct</p>
        </div>
        <div className="max-h-[42vh] overflow-y-auto border-t border-line">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
              {item.countryCode && item.flagUrl ? (
                <FlagImage code={item.countryCode} name={item.countryName ?? item.countryCode} src={item.flagUrl} className="mt-0.5 w-12 rounded-lg p-1" />
              ) : (
                <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.correct ? "bg-success/20 text-success" : "bg-error/20 text-error"}`}>
                  <Icon name={item.correct ? "check" : "x"} size={16} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 font-display text-[17px] font-semibold text-ink">{item.label}</p>
                  <Icon name={item.correct ? "check" : "x"} size={17} className={item.correct ? "text-success" : "text-error"} />
                </div>
                {item.context ? <p className="mt-0.5 text-xs font-semibold text-muted">{item.context}</p> : null}
                {!item.correct && (item.chosen || item.answer) ? (
                  <p className="mt-1 text-sm font-semibold">
                    {item.chosen ? <span className="mr-3 text-error">You: {item.chosen}</span> : null}
                    {item.answer ? <span className="text-success">Answer: {item.answer}</span> : null}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="safe-bottom sticky bottom-0 mt-4 grid gap-2 bg-paper pt-2">
        {actions.map((action, index) => (
          <button key={`${action.label}-${index}`} onClick={action.onPress} className={action.variant === "primary" ? "btn-primary" : "btn-secondary"}>
            <span className="inline-flex items-center justify-center gap-2">
              {action.icon ? <Icon name={action.icon} size={18} /> : null}
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
