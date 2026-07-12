import { useEffect } from "react";
import { Platform } from "react-native";
import { usePathname } from "expo-router";
import Head from "expo-router/head";
import { BRAND } from "@/config/brand";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

// react-native-web renders text in the system font stack by default; the
// startup Text.render patch that swaps in Figtree does not take effect on RNW
// (RNW's Text is a forwardRef whose render the patch can't intercept). So on web
// we load Figtree from Google Fonts and set it as the global text default. Icons
// are SVG and images are unaffected by font-family, so a broad rule is safe.
function useFigtreeWebFont() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    if (document.getElementById("figtree-web-font")) return;

    const preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";

    const preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "";

    const link = document.createElement("link");
    link.id = "figtree-web-font";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap";

    const style = document.createElement("style");
    style.id = "figtree-web-style";
    style.textContent = "*{font-family:'Figtree',-apple-system,system-ui,sans-serif !important}";

    document.head.append(preconnect1, preconnect2, link, style);
  }, []);
}

const ROUTE_TITLES: Record<string, string> = {
  "/": "Today",
  "/learn": "Learn",
  "/review": "Play",
  "/profile": "You",
  "/quiz": "Quiz",
  "/arcade": "Arcade",
  "/decks": "Decks",
  "/library": "Flag Library",
  "/map": "World Map",
  "/map/explore": "Explore Map",
  "/map/play": "Map Practice",
  "/stats": "Stats",
  "/test": "Custom Test",
  "/test-setup": "Custom Test",
  "/trivia": "Trivia",
  "/welcome": "Flaggo",
  "/auth/callback": "Sign In"
};

export default function WebDocumentHead() {
  const pathname = usePathname();
  const theme = useThemeStore((s) => s.theme);
  useFigtreeWebFont();
  if (Platform.OS !== "web") return null;

  const routeTitle = ROUTE_TITLES[pathname] ?? "Flaggo";
  const title = routeTitle === "Flaggo" ? BRAND.name : `${routeTitle} | ${BRAND.name}`;
  const description = "Master the world, one round at a time.";

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="theme-color" content={themeColor(theme, "primary")} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={BRAND.name} />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
    </Head>
  );
}
