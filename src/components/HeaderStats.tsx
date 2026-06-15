import type { AppProgress } from "../types/progress";
import Icon, { type IconName } from "./Icon";

export default function HeaderStats({ progress }: { progress: AppProgress }) {
  const items: { label: string; value: number; icon: IconName; color: string }[] = [
    { label: "XP", value: progress.xp, icon: "bolt", color: "text-flaggo-blue" },
    { label: "Streak", value: progress.streak, icon: "flame", color: "text-flaggo-orange" },
    { label: "Coins", value: progress.coins, icon: "coin", color: "text-flaggo-yellow" },
    { label: "Flags", value: Object.keys(progress.review).length, icon: "globe", color: "text-flaggo-green" }
  ];
  return (
    <div className="sticky top-0 z-20 grid grid-cols-4 gap-2 bg-flaggo-bg/85 px-4 py-3 backdrop-blur-md">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-2xl border border-flaggo-border bg-white px-1.5 py-2 text-center shadow-card"
        >
          <div className={`flex items-center gap-1 text-lg font-display font-extrabold ${item.color}`}>
            <Icon name={item.icon} size={16} />
            {item.value}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-flaggo-muted">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
