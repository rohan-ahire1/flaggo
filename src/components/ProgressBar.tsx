type Props = { value: number };

export default function ProgressBar({ value }: Props) {
  return (
    <div className="h-4 overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-flaggo-green transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
