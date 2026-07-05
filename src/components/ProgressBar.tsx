type Props = { value: number };

export default function ProgressBar({ value }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-4 overflow-hidden rounded-full bg-slate-200 shadow-inner">
      <div
        className="relative h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      >
        {/* Glossy highlight */}
        {pct > 6 && <span className="absolute inset-x-1 top-1 h-1 rounded-full bg-paper/40" />}
      </div>
    </div>
  );
}
