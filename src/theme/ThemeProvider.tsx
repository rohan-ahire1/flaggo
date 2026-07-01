import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyTheme, DEFAULT_THEME, themeColor, THEMES, THEME_ORDER, type ThemeKey } from "./palettes";

const STORAGE_KEY = "worldly-theme";

type ThemeContextValue = {
  theme: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  themes: typeof THEMES;
  order: ThemeKey[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadTheme(): ThemeKey {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeKey | null;
    if (stored && stored in THEMES) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>(loadTheme);

  // Apply CSS variables to <html> and keep the browser chrome color in sync.
  useEffect(() => {
    applyTheme(document.documentElement, theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", themeColor(theme, "primary"));
  }, [theme]);

  const setTheme = useCallback((key: ThemeKey) => {
    setThemeState(key);
    try {
      window.localStorage.setItem(STORAGE_KEY, key);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, themes: THEMES, order: THEME_ORDER }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
