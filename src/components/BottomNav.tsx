import type { Screen } from "../App";

const tabs: { screen: Screen; label: string; icon: string }[] = [
  { screen: "home", label: "Learn", icon: "1" },
  { screen: "review", label: "Review", icon: "2" },
  { screen: "library", label: "Library", icon: "3" },
  { screen: "stats", label: "Stats", icon: "4" },
  { screen: "profile", label: "Profile", icon: "5" }
];

export default function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-flaggo-border bg-white/95 px-2 pb-3 pt-2 shadow-[0_-12px_30px_rgba(38,50,56,0.08)] backdrop-blur">
      {tabs.map((tab) => (
        <button
          key={tab.screen}
          onClick={() => onNavigate(tab.screen)}
          className={`rounded-2xl px-1 py-2 text-center text-xs font-black transition active:scale-95 ${
            active === tab.screen ? "bg-flaggo-green text-white shadow-[0_4px_0_#46A302]" : "text-flaggo-muted"
          }`}
        >
          <div className={`mx-auto mb-1 grid h-6 w-6 place-items-center rounded-full text-[11px] ${active === tab.screen ? "bg-white/25" : "bg-slate-100"}`}>{tab.icon}</div>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
