import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import { Card, SectionLabel, softShadow } from "@/components/ui";
import ScreenHeader from "@/components/ScreenHeader";
import { useProgress } from "@/state/ProgressProvider";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import { ARCADE_MODES, arcadeKey, type ArcadeMode } from "@flaggo/core/types/arcade";
import type { Topic } from "@flaggo/core/types/topic";

const MODE_INFO: Record<ArcadeMode, { label: string; desc: string; icon: IconName }> = {
  timed: { label: "Timed", desc: "As many as you can, quickly.", icon: "clock" },
  sudden: { label: "Sudden death", desc: "One wrong answer ends it.", icon: "flame" },
  hard: { label: "Hard", desc: "Lookalike flags & tough calls.", icon: "brain" }
};

const TOPICS: { key: Topic; label: string }[] = [
  { key: "flag", label: "Flags" },
  { key: "capital", label: "Capitals" },
  { key: "currency", label: "Currencies" },
  { key: "language", label: "Languages" },
  { key: "neighbor", label: "Borders" }
];

export default function ArcadeScreen() {
  const { progress, setProgress } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const topic: Topic = progress.selectedTopic;

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScreenHeader title="Arcade" subtitle="Endless rounds, three ways." />
      <ScrollView contentContainerClassName="w-full max-w-[1120px] self-center px-5 pb-8 gap-5 pt-2 lg:px-8">
        <View className="gap-3">
          <SectionLabel>Topic</SectionLabel>
          <View className="flex-row flex-wrap gap-2">
            {TOPICS.map((t) => {
              const on = t.key === topic;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setProgress({ ...progress, selectedTopic: t.key })}
                  className={`rounded-full border-2 px-4 py-2 ${on ? "border-primary bg-primary" : "border-line bg-surface"}`}
                >
                  <Text className={`text-[15px] font-extrabold ${on ? "text-white" : "text-ink"}`}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <SectionLabel>Modes</SectionLabel>
          <View className="gap-3 md:flex-row md:flex-wrap md:justify-between">
          {ARCADE_MODES.map((mode) => {
            const best = progress.arcade[arcadeKey(mode, topic)] ?? 0;
            const info = MODE_INFO[mode];
            return (
              <Card
                key={mode}
                onPress={() => router.push({ pathname: "/quiz", params: { mode: "arcade", topic, amode: mode } })}
                className="flex-row items-center gap-3 md:w-[32%]"
              >
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface">
                  <Icon name={info.icon} size={24} color={themeColor(theme, "primary")} />
                </View>
                <View className="flex-1">
                  <Text className="text-[18px] font-black text-ink">{info.label}</Text>
                  <Text className="text-[13px] font-semibold text-muted">{info.desc}</Text>
                </View>
                <View className="items-end" style={softShadow}>
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">Best</Text>
                  <Text className="text-[20px] font-black text-primary">{best}</Text>
                </View>
              </Card>
            );
          })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
