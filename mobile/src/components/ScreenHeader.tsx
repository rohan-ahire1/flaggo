import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Icon from "./Icon";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

// Standard back-header for pushed (non-tab) screens.
export default function ScreenHeader({
  title,
  subtitle,
  right
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <View className="w-full max-w-[1120px] self-center flex-row items-center gap-3 px-5 pb-2 pt-1 lg:px-8">
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        hitSlop={12}
        className="h-10 w-10 items-center justify-center rounded-full bg-surface"
      >
        <Icon name="chevron-left" size={22} color={themeColor(theme, "ink")} />
      </Pressable>
      <View className="flex-1">
        <Text className="text-[24px] font-black text-ink">{title}</Text>
        {subtitle ? <Text className="text-[13px] font-semibold text-muted">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
