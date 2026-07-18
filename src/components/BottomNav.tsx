import { NavLink } from "react-router-dom";
import Icon, { type IconName } from "./Icon";

// Flag mastery is the spine. The library supports recognition and review;
// profile contains the wider progress and settings surface.
const tabs: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/", label: "Learn", icon: "flag", end: true },
  { to: "/review", label: "Review", icon: "review" },
  { to: "/library", label: "Flags", icon: "library" },
  { to: "/profile", label: "You", icon: "user" }
];

export default function BottomNav() {
  return (
    <nav className="safe-bottom z-30 flex shrink-0 justify-around border-t border-line bg-paper px-2 pt-2 shadow-[0_-10px_30px_rgba(20,30,40,0.06)]">
      {tabs.map((tab) => {
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `flex flex-col items-center gap-1 rounded-2xl px-1 py-1 text-[11px] font-display font-semibold transition-all active:scale-95 ${
              isActive ? "text-primary" : "text-muted"
            }`}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid h-[30px] w-[46px] place-items-center rounded-2xl transition-all duration-200 ${
                    isActive ? "bg-surface text-primary" : "text-muted"
                  }`}
                >
                  <Icon name={tab.icon} size={21} />
                </span>
                {tab.label}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
