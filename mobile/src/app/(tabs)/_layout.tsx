import type { ColorValue } from "react-native";
import { Tabs } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export default function TabsLayout() {
  const theme = useThemeStore((s) => s.theme);
  const active = themeColor(theme, "primary");
  const inactive = themeColor(theme, "muted");
  const paper = themeColor(theme, "paper");
  const line = themeColor(theme, "line");

  const icon =
    (name: IconName) =>
    ({ color }: { color: ColorValue }) =>
      <Icon name={name} size={22} color={color as string} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: paper,
          borderTopColor: line,
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28
        },
        tabBarLabelStyle: { fontFamily: "Figtree_700Bold", fontSize: 11 },
        tabBarItemStyle: { paddingTop: 2 }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: icon("today") }} />
      <Tabs.Screen name="review" options={{ title: "Play", tabBarIcon: icon("play") }} />
      <Tabs.Screen name="challenge" options={{ title: "Challenge", tabBarIcon: icon("flag") }} />
      <Tabs.Screen name="learn" options={{ title: "Learn", tabBarIcon: icon("book") }} />
      <Tabs.Screen name="profile" options={{ title: "You", tabBarIcon: icon("user") }} />
    </Tabs>
  );
}
