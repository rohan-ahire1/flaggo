import { useEffect } from "react";
import FlagImage from "./FlagImage";
import Icon, { type IconName } from "./Icon";
import ScoreRing from "./ScoreRing";
import { playComplete } from "../lib/sfx";

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
  variant?: "primary" | "secondary" | "ghost";
  icon?: IconName;
};

export type EarnedBadgeResult = {
  id: string;
  name: string;
  icon: IconName;
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
  earnedBadges,
  actions
}: {
  score: number;
  total: number;
  items: RoundResultItem[];
  streak?: number;
  caption?: string;
  earnedBadges?: EarnedBadgeResult[];
  actions: ResultAction[];
}) {
  const missed = items.filter((item) => !item.correct);
  const primaryAction = actions.find((action) => action.variant === "primary") ?? actions[0];
  const secondaryActions = actions.filter((action) => action !== primaryAction);
  useEffect(() => {
    playComplete();
  }, []);
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

      {earnedBadges?.length ? (
        <section className="mt-4 flex animate-pop-in items-center gap-3 rounded-[22px] border border-primary/30 bg-primary/10 p-4 shadow-card">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white">
            <Icon name="trophy" size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="section-label text-primary">Badge earned!</p>
            <p className="mt-0.5 font-display text-[18px] font-semibold text-ink">
              {earnedBadges.map((badge) => badge.name).join(", ")}
            </p>
          </div>
          <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-primary sm:grid">
            <Icon name={earnedBadges[0].icon} size={20} />
          </span>
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

      <section className="mt-3 rounded-[22px] border border-line bg-paper shadow-card">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="section-label">Review</p>
          <p className="text-sm font-bold text-muted">{score}/{total} correct</p>
        </div>
        <div className="border-t border-line">
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

      {/* Secondary/ghost actions flow with the page; only the primary sticks,
          so short viewports never bury the review list under a wall of CTAs. */}
      {secondaryActions.length ? (
        <div className="mt-4 grid gap-2">
          {secondaryActions.map((action, index) =>
            action.variant === "ghost" ? (
              <button key={`${action.label}-${index}`} onClick={action.onPress} className="btn-ghost justify-self-center">
                {action.label}
              </button>
            ) : (
              <button key={`${action.label}-${index}`} onClick={action.onPress} className="btn-secondary">
                <span className="inline-flex items-center justify-center gap-2">
                  {action.icon ? <Icon name={action.icon} size={18} /> : null}
                  {action.label}
                </span>
              </button>
            )
          )}
        </div>
      ) : null}

      {primaryAction ? (
        <div className="safe-bottom sticky bottom-0 mt-3 bg-paper pt-2">
          <button onClick={primaryAction.onPress} className="btn-primary w-full">
            <span className="inline-flex items-center justify-center gap-2">
              {primaryAction.icon ? <Icon name={primaryAction.icon} size={18} /> : null}
              {primaryAction.label}
            </span>
          </button>
        </div>
      ) : null}
    </main>
  );
}
