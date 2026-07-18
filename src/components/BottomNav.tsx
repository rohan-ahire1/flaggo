import { Link, useLocation } from "react-router-dom";
import Icon, { type IconName } from "./Icon";

// Flag mastery is the spine. The library supports recognition and review;
// profile contains the wider progress and settings surface.
const tabs: { to: string; label: string; icon: IconName; paths: string[] }[] = [
  { to: "/", label: "Learn", icon: "flag", paths: ["/", "/learn/*"] },
  { to: "/review", label: "Review", icon: "review", paths: ["/review", "/test-setup", "/map", "/decks"] },
  { to: "/library", label: "Flags", icon: "library", paths: ["/library", "/map/explore"] },
  { to: "/profile", label: "You", icon: "user", paths: ["/profile", "/stats"] }
];

export function isTabPath(pathname: string, paths: string[]) {
  return paths.some((path) => {
    if (!path.endsWith("/*")) return pathname === path;
    const base = path.slice(0, -2);
    return pathname === base || pathname.startsWith(`${base}/`);
  });
}

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="safe-bottom z-30 flex shrink-0 justify-around border-t border-line bg-paper px-2 pt-2 shadow-[0_-10px_30px_rgba(20,30,40,0.06)]">
      {tabs.map((tab) => {
        const isActive = isTabPath(pathname, tab.paths);
        return (
          <Link
            key={tab.to}
            to={tab.to}
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
          </Link>
        );
      })}
    </nav>
  );
}
