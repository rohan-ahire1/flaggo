import { Pressable, Text, View } from "react-native";
import { THEME_ORDER, THEMES } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export default function ThemeSwitcher() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <View className="gap-2">
      {THEME_ORDER.map((key) => {
        const meta = THEMES[key];
        const on = key === theme;
        return (
          <Pressable
            key={key}
            onPress={() => setTheme(key)}
            className={`flex-row items-center gap-3 rounded-2xl border-2 p-3 ${on ? "border-primary" : "border-line"}`}
          >
            <View className="flex-row">
              {(["primary", "accent", "surface2"] as const).map((token) => (
                <View
                  key={token}
                  className="h-6 w-6 rounded-full border border-black/10"
                  style={{ backgroundColor: `rgb(${meta.channels[token]})`, marginLeft: token === "primary" ? 0 : -6 }}
                />
              ))}
            </View>
            <View className="flex-1">
              <Text className="font-black text-ink">{meta.label}</Text>
              <Text className="text-xs font-semibold text-muted">{meta.desc}</Text>
            </View>
            {on ? <Text className="font-bold text-primary">Active</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
