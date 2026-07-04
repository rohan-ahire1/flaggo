import type { Screen } from "../App";
import Icon, { type IconName } from "./Icon";

// Worldly IA: structured learning is the spine (Learn), with Today's habit loop
// and the social/compete loop supporting retention. Each tab maps to a screen.
const tabs: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: "home", label: "Today", icon: "today" },
  { screen: "review", label: "Practice", icon: "play" },
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
