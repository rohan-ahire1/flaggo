// Worldly theme palettes, ported from the web app. Channel strings ("R G B")
// feed NativeWind's rgb(var(--x) / <alpha-value>) tokens so opacity utilities
// (bg-primary/10 etc.) keep working, exactly like the web CSS-variable setup.

export type ThemeKey = "ocean" | "parchment" | "topographic" | "slate";

export type PaletteChannels = {
  paper: string;
  surface: string;
  surface2: string;
  line: string;
  ink: string;
  muted: string;
  primary: string;
  primaryDark: string;
  accent: string;
  success: string;
  error: string;
  map: string;
};

export type ThemeMeta = {
  key: ThemeKey;
  label: string;
  desc: string;
  channels: PaletteChannels;
};

export const THEMES: Record<ThemeKey, ThemeMeta> = {
  ocean: {
    key: "ocean",
    label: "Ocean & Atlas",
    desc: "Deep ocean blue · warm sand",
    channels: {
      paper: "250 246 238",
      surface: "241 235 221",
      surface2: "230 220 200",
      line: "219 207 185",
      ink: "32 48 58",
      muted: "95 113 120",
      primary: "20 80 107",
      primaryDark: "14 58 78",
      accent: "217 138 61",
      success: "63 125 82",
      error: "193 87 77",
      map: "212 226 220"
    }
  },
  parchment: {
    key: "parchment",
    label: "Parchment",
    desc: "Vintage atlas · sepia & terracotta",
    channels: {
      paper: "248 241 227",
      surface: "239 228 207",
      surface2: "230 215 188",
      line: "220 201 166",
      ink: "58 46 33",
      muted: "122 106 85",
      primary: "168 81 44",
      primaryDark: "125 58 31",
      accent: "47 109 99",
      success: "91 125 63",
      error: "179 73 47",
      map: "231 217 189"
    }
  },
  topographic: {
    key: "topographic",
    label: "Topographic",
    desc: "Contour teal · sand accent",
    channels: {
      paper: "240 244 241",
      surface: "228 236 231",
      surface2: "211 224 216",
      line: "195 214 203",
      ink: "29 43 39",
      muted: "92 112 104",
      primary: "31 122 109",
      primaryDark: "20 86 76",
      accent: "207 138 60",
      success: "63 125 82",
      error: "193 87 77",
      map: "214 230 220"
    }
  },
  slate: {
    key: "slate",
    label: "Slate",
    desc: "Clean, neutral, familiar",
    channels: {
      paper: "255 255 255",
      surface: "244 245 247",
      surface2: "233 235 239",
      line: "220 223 229",
      ink: "28 37 48",
      muted: "93 107 122",
      primary: "58 110 165",
      primaryDark: "44 85 128",
      accent: "58 110 165",
      success: "63 125 82",
      error: "193 87 77",
      map: "231 235 241"
    }
  }
};

export const THEME_ORDER: ThemeKey[] = ["ocean", "parchment", "topographic", "slate"];
export const DEFAULT_THEME: ThemeKey = "ocean";

/** Map a palette to the CSS-variable object NativeWind's `vars()` expects. */
export function themeVars(key: ThemeKey): Record<string, string> {
  const c = (THEMES[key] ?? THEMES[DEFAULT_THEME]).channels;
  return {
    "--paper": c.paper,
    "--surface": c.surface,
    "--surface-2": c.surface2,
    "--line": c.line,
    "--ink": c.ink,
    "--muted": c.muted,
    "--primary": c.primary,
    "--primary-dark": c.primaryDark,
    "--accent": c.accent,
    "--success": c.success,
    "--error": c.error,
    "--map": c.map
  };
}

/** `rgb(R G B)` for a single token — for non-className consumers (SVG, StatusBar). */
export function themeColor(key: ThemeKey, token: keyof PaletteChannels): string {
  const c = (THEMES[key] ?? THEMES[DEFAULT_THEME]).channels;
  return `rgb(${c[token]})`;
}
