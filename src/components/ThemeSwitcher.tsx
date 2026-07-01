import { useTheme } from "../theme/ThemeProvider";

// Live palette switcher — re-themes every screen on tap (Settings · Appearance).
export default function ThemeSwitcher() {
  const { theme, setTheme, themes, order } = useTheme();
  return (
    <div className="flex flex-col gap-2.5">
      {order.map((key) => {
        const meta = themes[key];
        const selected = key === theme;
        const c = meta.channels;
        return (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`flex items-center gap-3.5 rounded-[18px] border-2 p-3 text-left transition ${
              selected ? "border-primary bg-surface" : "border-line bg-paper"
            }`}
          >
            <span
              className="relative h-[52px] w-[52px] flex-none overflow-hidden rounded-[13px] border border-black/10"
              style={{ background: `rgb(${c.primary})` }}
            >
              <span className="absolute left-2 top-2 h-[13px] w-[13px] rounded-full" style={{ background: `rgb(${c.accent})` }} />
              <span className="absolute inset-x-2 bottom-2 h-2 rounded" style={{ background: `rgb(${c.paper})` }} />
            </span>
            <span className="flex-1">
              <span className="block font-display text-[17px] font-medium text-ink">{meta.label}</span>
              <span className="block text-[13px] text-muted">{meta.desc}</span>
            </span>
            <span
              className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-full border-2 text-[15px] font-extrabold ${
                selected ? "border-primary bg-primary text-white" : "border-line text-transparent"
              }`}
            >
              ✓
            </span>
          </button>
        );
      })}
    </div>
  );
}
