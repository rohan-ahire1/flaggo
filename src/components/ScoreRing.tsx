import { useEffect, useState } from "react";

export default function ScoreRing({ score, total, caption }: { score: number; total: number; caption?: string }) {
  const [mounted, setMounted] = useState(false);
  const radius = 56;
  const stroke = 10;
  const size = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.max(0, Math.min(1, score / total)) : 0;

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="grid justify-items-center">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(var(--primary))"
            strokeLinecap="round"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (mounted ? pct : 0) * circumference}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-display text-4xl font-black leading-none text-ink">{score}</div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted">of {total}</div>
        </div>
      </div>
      {caption ? <p className="mt-2 text-sm font-semibold text-muted">{caption}</p> : null}
    </div>
  );
}
