import type { Screen } from "../App";
import Icon, { type IconName } from "./Icon";

// Flaggo IA: the daily habit and the social/compete loop lead; the learning
// spine is depth. Each tab maps to an existing top-level screen.
const tabs: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: "home", label: "Today", icon: "today" },
  { screen: "review", label: "Play", icon: "play" },
  { screen: "friends", label: "Challenge", icon: "flag" },
  { screen: "paths", label: "Learn", icon: "book" },
  { screen: "profile", label: "You", icon: "user" }
];

export default function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className="safe-bottom z-30 flex shrink-0 justify-around border-t border-line bg-paper px-2 pt-2 shadow-[0_-10px_30px_rgba(20,30,40,0.06)]">
      {tabs.map((tab) => {
        const isActive = active === tab.screen;
        return (
          <button
            key={tab.screen}
            onClick={() => onNavigate(tab.screen)}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-1 text-[11px] font-display font-semibold transition-all active:scale-95 ${
              isActive ? "text-primary" : "text-muted"
            }`}
          >
            <span
              className={`grid h-[30px] w-[46px] place-items-center rounded-2xl transition-all duration-200 ${
                isActive ? "bg-surface text-primary" : "text-muted"
              }`}
            >
              <Icon name={tab.icon} size={21} />
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
