import type { IconName } from "../components/Icon";

export type AppTab = {
  id: "learn" | "review" | "library" | "profile";
  to: string;
  label: string;
  icon: IconName;
  paths: string[];
};

// A bottom tab owns every non-immersive screen listed here. Tab switches use
// history replacement, so browser Back never cycles through previously tapped
// tabs like a stack of modal screens.
export const APP_TABS: AppTab[] = [
  { id: "learn", to: "/", label: "Learn", icon: "flag", paths: ["/"] },
  { id: "review", to: "/review", label: "Review", icon: "review", paths: ["/review", "/test-setup", "/map", "/decks"] },
  { id: "library", to: "/library", label: "Flags", icon: "library", paths: ["/library", "/map/explore"] },
  { id: "profile", to: "/profile", label: "You", icon: "user", paths: ["/profile", "/stats"] }
];

const IMMERSIVE_PATHS = [
  "/welcome",
  "/review/flashcards",
  "/review/play",
  "/test",
  "/map/play",
  "/daily",
  "/arcade",
  "/trivia",
  "/kids"
];

export function matchesPath(pathname: string, pattern: string) {
  if (!pattern.endsWith("/*")) return pathname === pattern;
  const base = pattern.slice(0, -2);
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function tabForPath(pathname: string) {
  return APP_TABS.find((tab) => tab.paths.some((path) => matchesPath(pathname, path))) ?? null;
}

export function hasAppChrome(pathname: string) {
  return !IMMERSIVE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
