import type { Screen } from "../App";
import Icon, { type IconName } from "./Icon";

const tabs: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: "home", label: "Learn", icon: "learn" },
  { screen: "review", label: "Review", icon: "review" },
  { screen: "library", label: "Library", icon: "library" },
  { screen: "stats", label: "Stats", icon: "stats" },
  { screen: "profile", label: "Profile", icon: "profile" }
];

export default function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-flaggo-border bg-white/90 px-2 pt-2 shadow-[0_-12px_30px_rgba(38,50,56,0.08)] backdrop-blur-lg">
      {tabs.map((tab) => {
        const isActive = active === tab.screen;
        return (
          <button
            key={tab.screen}
            onClick={() => onNavigate(tab.screen)}
            aria-current={isActive ? "page" : undefined}
            className={`group flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-display font-extrabold transition-all active:scale-95 ${
              isActive ? "text-flaggo-green" : "text-flaggo-muted hover:text-flaggo-text"
            }`}
          >
            <span
              className={`grid h-9 w-12 place-items-center rounded-2xl transition-all duration-200 ${
                isActive ? "bg-flaggo-green/15 text-flaggo-green" : "text-flaggo-muted group-hover:bg-slate-100"
              }`}
            >
              <Icon name={tab.icon} size={22} className={isActive ? "scale-110 transition-transform" : "transition-transform"} />
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
