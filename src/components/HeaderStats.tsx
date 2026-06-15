import type { AppProgress } from "../types/progress";

export default function HeaderStats({ progress }: { progress: AppProgress }) {
  const items = [
    ["XP", progress.xp, "text-flaggo-blue"],
    ["Streak", progress.streak, "text-flaggo-orange"],
    ["Coins", progress.coins, "text-flaggo-yellow"],
    ["Flags", Object.keys(progress.review).length, "text-flaggo-green"]
  ];
  return (
    <div className="sticky top-0 z-20 grid grid-cols-4 gap-2 bg-flaggo-bg/95 px-4 py-3 backdrop-blur">
      {items.map(([label, value, color]) => (
        <div key={label} className="rounded-2xl border border-flaggo-border bg-white px-2 py-2 text-center shadow-[0_4px_0_#e5e7eb]">
          <div className={`text-lg font-black ${color}`}>{value}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-flaggo-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}
