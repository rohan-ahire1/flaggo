import type { ColorValue } from "react-native";
import { Platform, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

const TAB_ITEMS: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "Today", icon: "today" },
  { name: "review", title: "Play", icon: "play" },
  { name: "challenge", title: "Challenge", icon: "flag" },
  { name: "learn", title: "Learn", icon: "book" },
  { name: "profile", title: "You", icon: "user" }
];

export default function TabsLayout() {
  const theme = useThemeStore((s) => s.theme);
  const { width } = useWindowDimensions();
  const active = themeColor(theme, "primary");
  const inactive = themeColor(theme, "muted");
  const paper = themeColor(theme, "paper");
  const line = themeColor(theme, "line");
  const showSidebar = Platform.OS === "web" && width >= 1024;

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
          display: showSidebar ? "none" : "flex",
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
      {TAB_ITEMS.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title, tabBarIcon: icon(item.icon) }} />
      ))}
    </Tabs>
  );
}
