import type { ReactNode } from "react";
import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { router, usePathname } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

const NAV_ITEMS: { title: string; href: string; icon: IconName }[] = [
  { title: "Today", href: "/", icon: "today" },
  { title: "Play", href: "/review", icon: "play" },
  { title: "Challenge", href: "/challenge", icon: "flag" },
  { title: "Learn", href: "/learn", icon: "book" },
  { title: "You", href: "/profile", icon: "user" }
];

function activeFor(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "/(tabs)" || pathname === "/welcome";
  if (href === "/review") {
    return (
      pathname === "/review" ||
      pathname.startsWith("/quiz") ||
      pathname.startsWith("/test") ||
      pathname.startsWith("/map") ||
      pathname.startsWith("/trivia") ||
      pathname.startsWith("/arcade")
    );
  }
  if (href === "/challenge") {
    return pathname === "/challenge" || pathname.startsWith("/friends") || pathname.startsWith("/match");
  }
  return pathname === href;
}

export default function WebSidebarShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const theme = useThemeStore((s) => s.theme);
  const pathname = usePathname();

  if (Platform.OS !== "web" || width < 1024) return children;

  const active = themeColor(theme, "primary");
  const inactive = themeColor(theme, "muted");
  const line = themeColor(theme, "line");

  return (
    <View className="flex-1 flex-row bg-surface">
      <View
        className="w-[248px] justify-between bg-surface px-4 py-6"
        style={{ borderRightColor: line, borderRightWidth: 1 }}
      >
        <View className="gap-6">
          <View className="gap-1 px-2">
            <Text className="text-[28px] font-black text-ink">Flaggo</Text>
            <Text className="text-[12px] font-extrabold uppercase tracking-[2px] text-muted">Daily geography</Text>
          </View>

          <View className="gap-1">
            {NAV_ITEMS.map((item) => {
              const selected = activeFor(pathname, item.href);
              return (
                <Pressable
                  key={item.href}
                  accessibilityRole="link"
                  onPress={() => router.replace(item.href as never)}
                  className={`flex-row items-center gap-3 rounded-2xl px-3 py-3 ${selected ? "bg-primary" : ""}`}
                >
                  <Icon name={item.icon} size={21} color={selected ? "#ffffff" : inactive} />
                  <Text className={`text-[16px] font-extrabold ${selected ? "text-white" : "text-ink"}`}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="rounded-2xl border border-line bg-paper p-3">
          <Text className="text-[12px] font-extrabold uppercase tracking-[1px]" style={{ color: active }}>
            Web preview
          </Text>
          <Text className="mt-1 text-[13px] font-semibold text-muted">
            Expo web runs in parallel with the live Vite app.
          </Text>
        </View>
      </View>

      <View className="min-w-0 flex-1 bg-paper">{children}</View>
    </View>
  );
}
