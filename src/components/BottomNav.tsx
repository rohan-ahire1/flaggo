import { Link, useLocation } from "react-router-dom";
import { APP_TABS, matchesPath } from "../navigation/appNavigation";
import Icon from "./Icon";

export function isTabPath(pathname: string, paths: string[]) {
  return paths.some((path) => matchesPath(pathname, path));
}

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="safe-bottom z-30 flex shrink-0 justify-around border-t border-line bg-paper px-2 pt-2 shadow-[0_-10px_30px_rgba(20,30,40,0.06)]">
      {APP_TABS.map((tab) => {
        const isActive = isTabPath(pathname, tab.paths);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            replace
            aria-current={isActive ? "page" : undefined}
            className={`flex min-w-[64px] flex-col items-center gap-1 rounded-2xl border-2 px-2 py-1 text-[11px] font-display font-semibold transition-all active:scale-95 ${
              isActive ? "border-accent text-accentDeep" : "border-transparent text-muted"
            }`}
          >
            <span className="grid h-[30px] w-[46px] place-items-center transition-colors duration-200">
              <Icon name={tab.icon} size={21} weight={isActive ? "fill" : "duotone"} />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
