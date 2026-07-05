import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import FlagImage from "@/components/FlagImage";
import { Card, PillButton, SectionLabel } from "@/components/ui";
import { countries } from "@flaggo/core/data/countries";
import { useProgress } from "@/state/ProgressProvider";
import { getDueCountries, getWeakCountries } from "@flaggo/core/utils/spacedRepetition";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import type { Topic } from "@flaggo/core/types/topic";

const TOPICS: { key: Topic; label: string }[] = [
  { key: "flag", label: "Flags" },
  { key: "capital", label: "Capitals" },
  { key: "currency", label: "Currencies" },
  { key: "language", label: "Languages" },
  { key: "neighbor", label: "Borders" }
];

const QUICK: { label: string; icon: IconName; route: string }[] = [
  { label: "Arcade", icon: "bolt", route: "/arcade" },
  { label: "Trivia", icon: "sparkle", route: "/trivia" },
  { label: "Custom test", icon: "target", route: "/test-setup" },
  { label: "Map practice", icon: "globe", route: "/map" }
];

export default function ReviewScreen() {
  const { progress, setProgress } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const topic = progress.selectedTopic === "location" ? "flag" : progress.selectedTopic;

  const topicCountries = topic === "capital" ? countries.filter((c) => c.capital?.trim()) : countries;
  const due = getDueCountries(progress, topicCountries, topic).slice(0, 12);
  const weak = getWeakCountries(progress, topicCountries, topic).slice(0, 6);
  const label = TOPICS.find((t) => t.key === topic)?.label.toLowerCase() ?? "flags";
  const reviewCodes = due.length ? due.map((c) => c.code).join(",") : weak.length ? weak.map((c) => c.code).join(",") : undefined;

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <ScrollView contentContainerClassName="w-full max-w-[1120px] self-center p-5 pb-8 gap-5 lg:p-8">
        <View>
          <Text className="text-[32px] font-black text-ink">Play</Text>
          <Text className="text-[15px] font-semibold text-muted">Review what's due, then go endless.</Text>
        </View>

        <View className="gap-2">
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
                  <Text className={`text-[14px] font-extrabold ${on ? "text-white" : "text-ink"}`}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Due hero */}
        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Icon name="review" size={28} color={themeColor(theme, "primary")} />
            </View>
            <View>
              <Text className="text-[44px] font-black leading-none text-primary">{due.length}</Text>
              <Text className="mt-1 font-bold text-muted">
                {due.length ? `${label} due for review` : "No reviews due today."}
              </Text>
            </View>
          </View>
          <PillButton
            label={due.length ? "Start review" : "Practice anyway"}
            variant="primary"
            icon="bolt"
            onPress={() => router.push({ pathname: "/quiz", params: reviewCodes ? { mode: "lesson", topic, codes: reviewCodes } : { mode: "lesson", topic } })}
          />
        </Card>

        {/* Quick modes */}
        <View className="gap-3">
          <SectionLabel>More ways to play</SectionLabel>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {QUICK.map((q) => (
              <Card key={q.label} onPress={() => router.push(q.route as never)} className="w-[48%] gap-3 md:w-[23.5%]">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface">
                  <Icon name={q.icon} size={22} color={themeColor(theme, "primary")} />
                </View>
                <Text className="text-[16px] font-black text-ink">{q.label}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Weakest */}
        {weak.length ? (
          <View className="gap-3">
            <SectionLabel>Weakest {label}</SectionLabel>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {weak.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => router.push({ pathname: "/quiz", params: { mode: "lesson", topic, codes: c.code } })}
                  className="w-[31%] md:w-[15%]"
                >
                  <FlagImage code={c.code} width={160} />
                  <Text className="mt-1 text-[12px] font-bold text-muted" numberOfLines={1}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
