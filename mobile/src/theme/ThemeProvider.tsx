import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import { vars } from "nativewind";
import { useThemeStore } from "./store";
import { themeVars, type ThemeKey } from "./palettes";

// Wraps the app in a View whose CSS variables are set from the active palette.
// NativeWind cascades these to every `bg-primary` / `text-ink` className below,
// so switching themes re-colors the whole tree instantly — the RN equivalent of
// the web app setting variables on <html>.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <View style={[{ flex: 1 }, vars(themeVars(theme as ThemeKey))]}>{children}</View>
  );
}
