// Flaggo theme palettes (from the "Flaggo Hi-Fi" design).
// Stored as "R G B" channel strings so Tailwind's `rgb(var(--x) / <alpha-value>)`
// tokens keep working with opacity utilities (e.g. bg-primary/10).

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
  /** Darker accent that meets 4.5:1 contrast on `paper` — use for accent-colored text. */
  accentDeep: string;
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

// Each value is an "R G B" triplet (sRGB channels).
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
      muted: "86 103 110",
      primary: "20 80 107",
      primaryDark: "14 58 78",
      accent: "217 138 61",
      accentDeep: "163 92 26",
      success: "56 112 73",
      error: "183 76 66",
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
      muted: "110 95 74",
      primary: "168 81 44",
      primaryDark: "125 58 31",
      accent: "47 109 99",
      accentDeep: "47 109 99",
      success: "78 108 54",
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
      muted: "84 104 96",
      primary: "31 122 109",
      primaryDark: "20 86 76",
      accent: "207 138 60",
      accentDeep: "158 94 28",
      success: "56 112 73",
      error: "183 76 66",
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
      accentDeep: "58 110 165",
      success: "56 112 73",
      error: "183 76 66",
      map: "231 235 241"
    }
  }
};

export const THEME_ORDER: ThemeKey[] = ["ocean", "parchment", "topographic", "slate"];
export const DEFAULT_THEME: ThemeKey = "ocean";

const VAR_NAMES: Record<keyof PaletteChannels, string> = {
  paper: "--paper",
  surface: "--surface",
  surface2: "--surface-2",
  line: "--line",
  ink: "--ink",
  muted: "--muted",
  primary: "--primary",
  primaryDark: "--primary-dark",
  accent: "--accent",
  accentDeep: "--accent-deep",
  success: "--success",
  error: "--error",
  map: "--map"
};

/** Apply a palette's channels to the given element's CSS variables. */
export function applyTheme(el: HTMLElement, key: ThemeKey): void {
  const theme = THEMES[key] ?? THEMES[DEFAULT_THEME];
  for (const k of Object.keys(theme.channels) as (keyof PaletteChannels)[]) {
    el.style.setProperty(VAR_NAMES[k], theme.channels[k]);
  }
  el.dataset.theme = theme.key;
}

/** `rgb(R G B)` string for a single token — handy for meta theme-color, canvas, etc. */
export function themeColor(key: ThemeKey, token: keyof PaletteChannels): string {
  const theme = THEMES[key] ?? THEMES[DEFAULT_THEME];
  return `rgb(${theme.channels[token]})`;
}
