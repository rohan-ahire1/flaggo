import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon, { type IconName } from "@/components/Icon";
import FlagImage from "@/components/FlagImage";
import ScreenHeader from "@/components/ScreenHeader";
import { Card, SectionLabel } from "@/components/ui";
import { countries } from "@flaggo/core/data/countries";
import { useProgress } from "@/state/ProgressProvider";
import { generateLessons, lessonsForTopic } from "@flaggo/core/utils/lessonGenerator";
import { getMasteredCountries, getWeakCountries } from "@flaggo/core/utils/spacedRepetition";
import { parseReviewKey, reviewKey } from "@flaggo/core/types/topic";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export default function StatsScreen() {
  const { progress } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const topic = progress.selectedTopic === "location" ? "flag" : progress.selectedTopic;
  const total = progress.totalCorrect + progress.totalWrong;

  const topicCountries = topic === "capital" ? countries.filter((c) => c.capital?.trim()) : countries;
  const weak = getWeakCountries(progress, topicCountries, topic).slice(0, 5);
  const flagMastered = getMasteredCountries(progress, countries, "flag").length;
  const capitalMastered = getMasteredCountries(
    progress,
    countries.filter((c) => c.capital?.trim()),
    "capital"
  ).length;
  const seen = Object.keys(progress.review).filter((k) => parseReviewKey(k).topic === topic).length;
  const completed = useMemo(
    () => lessonsForTopic(generateLessons(countries), topic).filter((l) => progress.completedLessonIds.includes(l.id)).length,
    [topic, progress.completedLessonIds]
  );
  const topicLabel = topic === "capital" ? "Capitals" : "Flags";
  const regions = Array.from(new Set(countries.map((c) => c.continent))).filter(Boolean) as string[];

  const stats: { label: string; value: string | number; icon: IconName }[] = [
    { label: "Total XP", value: progress.xp, icon: "bolt" },
    { label: "Current streak", value: progress.streak, icon: "flame" },
    { label: "Lessons done", value: completed, icon: "check" },
    { label: `${topicLabel} seen`, value: seen, icon: "globe" },
    { label: "Flags mastered", value: flagMastered, icon: "star" },
    { label: "Capitals mastered", value: capitalMastered, icon: "star" },
    { label: "Daily streak", value: progress.daily.streak, icon: "today" },
    { label: "Accuracy", value: total ? `${Math.round((progress.totalCorrect / total) * 100)}%` : "0%", icon: "target" }
  ];

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScreenHeader title="Stats" />
      <ScrollView contentContainerClassName="w-full max-w-[1120px] self-center px-5 pb-8 gap-5 pt-2 lg:px-8">
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {stats.map((s) => (
            <Card key={s.label} className="w-[48%] gap-1 md:w-[23.5%]">
              <Icon name={s.icon} size={20} color={themeColor(theme, "primary")} />
              <Text className="text-[24px] font-black text-ink">{s.value}</Text>
              <Text className="text-[12px] font-bold uppercase tracking-wide text-muted">{s.label}</Text>
            </Card>
          ))}
        </View>

        <View className="gap-3">
          <SectionLabel>Weakest {topicLabel.toLowerCase()}</SectionLabel>
          {weak.length ? (
            <Card className="gap-0 p-0">
              {weak.map((c, i) => (
                <View key={c.code} className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}>
                  <View className="w-12">
                    <FlagImage code={c.code} width={120} />
                  </View>
                  <Text className="flex-1 font-black text-ink" numberOfLines={1}>
                    {c.name}
                  </Text>
                  <View className="rounded-full bg-error/15 px-2.5 py-1">
                    <Text className="text-[12px] font-extrabold text-error">
                      {progress.review[reviewKey(c.code, topic)]?.wrongCount ?? 0} misses
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          ) : (
            <Card>
              <Text className="font-bold text-muted">No weak {topicLabel.toLowerCase()} yet.</Text>
            </Card>
          )}
        </View>

        <View className="gap-3">
          <SectionLabel>Region progress</SectionLabel>
          <Card className="gap-3">
            {regions.map((region) => {
              const group = topicCountries.filter((c) => c.continent === region);
              const done = group.filter((c) => (progress.review[reviewKey(c.code, topic)]?.box ?? 0) >= 5).length;
              const pct = group.length ? Math.round((done / group.length) * 100) : 0;
              return (
                <View key={region} className="gap-1">
                  <View className="flex-row justify-between">
                    <Text className="text-[13px] font-bold text-ink">{region}</Text>
                    <Text className="text-[13px] font-bold text-muted">
                      {done}/{group.length}
                    </Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <View className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                  </View>
                </View>
              );
            })}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
