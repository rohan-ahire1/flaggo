import { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";

export type ResultStat = { icon: IconName; label: string; value: string; tone?: string };
export type ResultAction = { label: string; onClick: () => void; kind?: "primary" | "secondary" | "ghost"; disabled?: boolean };

const CONFETTI = ["#58CC02", "#1CB0F6", "#FFC800", "#FF9600", "#CE82FF", "#FF4B4B"];

/**
 * One result surface shared by every "end of run" screen (lessons, map practice,
 * arcade, trivia, matches) so celebration, stats, and actions look identical
 * across the app. Purely presentational — each screen maps its data onto it.
 */
export default function ResultCard({
  icon = "trophy",
  title,
  praise,
  praiseTone = "text-flaggo-orange",
  badge,
  ringPercent,
  heroValue,
  heroCaption,
  heroIcon,
  stats,
  actions = [],
  confetti = false,
  children
}: {
  icon?: IconName;
  title: string;
  praise?: string;
  praiseTone?: string;
  badge?: string;
  ringPercent?: number;
  heroValue?: string;
  heroCaption?: string;
  heroIcon?: IconName;
  stats?: ResultStat[];
  actions?: ResultAction[];
  confetti?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="flaggo-card relative w-full animate-pop-in overflow-hidden p-7 text-center">
      {confetti && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 h-2.5 w-2.5 animate-confetti rounded-[2px]"
              style={{ left: `${(i * 5.5 + 4) % 100}%`, background: CONFETTI[i % CONFETTI.length], animationDelay: `${(i % 6) * 90}ms` }}
            />
          ))}
        </div>
      )}

      {ringPercent != null ? (
        <AccuracyRing percent={ringPercent} />
      ) : (
        <div className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-flaggo-yellow to-flaggo-orange text-white shadow-[0_8px_0_rgb(var(--accent)/0.4)]">
          <Icon name={icon} size={46} />
        </div>
      )}

      <h1 className="screen-title">{title}</h1>
      {praise && (
        <p className={`mt-1.5 inline-flex items-center gap-1 font-display font-extrabold ${praiseTone}`}>
          <Icon name="star" size={16} /> {praise}
        </p>
      )}
      {badge && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-flaggo-orange/15 px-3 py-1 font-display text-sm font-black text-flaggo-orange">
          <Icon name="bolt" size={14} /> {badge}
        </p>
      )}

      {heroValue != null && (
        <div className="my-6 rounded-[24px] bg-gradient-to-br from-green-50 to-flaggo-bg p-5">
          <div className="flex animate-xp-pop items-center justify-center gap-2 font-display text-5xl font-black text-flaggo-green">
            {heroIcon && <Icon name={heroIcon} size={40} />}
            {heroValue}
          </div>
          {heroCaption && <div className="mt-1 text-lg font-bold text-flaggo-muted">{heroCaption}</div>}
        </div>
      )}

      {stats && stats.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-flaggo-border bg-white p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-flaggo-muted">
                <Icon name={stat.icon} size={14} className={stat.tone ?? "text-flaggo-blue"} /> {stat.label}
              </div>
              <div className={`mt-1 font-display text-2xl font-black ${stat.tone ?? "text-flaggo-blue"}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {children}

      {actions.length > 0 && (
        <div className="mt-6 grid gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.kind === "secondary" ? "btn-secondary" : action.kind === "ghost" ? "btn-ghost" : "btn-primary"}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function AccuracyRing({ percent }: { percent: number }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const [offset, setOffset] = useState(C);
  const shown = useCountUp(Math.round(percent));
  const raf = useRef(0);

  useEffect(() => {
    raf.current = requestAnimationFrame(() => setOffset(C * (1 - Math.max(0, Math.min(100, percent)) / 100)));
    return () => cancelAnimationFrame(raf.current);
  }, [C, percent]);

  return (
    <div className="relative mx-auto mb-4 h-28 w-28">
      <svg viewBox="0 0 104 104" className="h-28 w-28 -rotate-90">
        <circle cx="52" cy="52" r={R} fill="none" stroke="rgb(var(--line))" strokeWidth="9" />
        <circle
          cx="52"
          cy="52"
          r={R}
          fill="none"
          stroke="rgb(var(--primary))"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.34, 1.2, 0.64, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-3xl font-black text-flaggo-text">{shown}%</span>
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}
