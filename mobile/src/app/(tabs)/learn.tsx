import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon from "@/components/Icon";
import { Card } from "@/components/ui";
import { countries } from "@flaggo/core/data/countries";
import { generateLessons, lessonsForTopic } from "@flaggo/core/utils/lessonGenerator";
import { useProgress } from "@/state/ProgressProvider";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import type { Lesson } from "@flaggo/core/types/lesson";
import type { Topic } from "@flaggo/core/types/topic";

const REGION_ORDER = ["World", "Asia", "Europe", "Africa", "Americas", "Oceania", "Territories"];
const LEARN_TOPICS: { key: Topic; label: string }[] = [
  { key: "flag", label: "Flags" },
  { key: "capital", label: "Capitals" },
  { key: "currency", label: "Currencies" },
  { key: "location", label: "Map" },
  { key: "language", label: "Languages" }
];
const COUNT_LABELS: Partial<Record<Topic, string>> = { capital: "capitals", currency: "currencies", location: "countries", language: "languages" };

export default function LearnScreen() {
  const { progress } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const [topic, setTopic] = useState<Topic>(
    LEARN_TOPICS.some((t) => t.key === progress.selectedTopic) ? progress.selectedTopic : "flag"
  );
  const [region, setRegion] = useState<string | null>(null);

  const allLessons = useMemo(() => generateLessons(countries), []);
  const topicLessons = useMemo(() => lessonsForTopic(allLessons, topic), [allLessons, topic]);

  const regions = useMemo(
    () =>
      REGION_ORDER.map((name) => ({
        name,
        lessons: topicLessons.filter((l) => l.region === name)
      })).filter((r) => r.lessons.length),
    [topicLessons]
  );
  const visible = region ? topicLessons.filter((l) => l.region === region) : [];

  function openLesson(lesson: Lesson) {
    if (lesson.topic === "location") {
      router.push({ pathname: "/map/play", params: { mode: "locate", codes: lesson.countryCodes.join(","), lessonId: lesson.id } });
      return;
    }
    router.push({ pathname: "/quiz", params: { mode: "lesson", lessonId: lesson.id } });
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <ScrollView contentContainerClassName="w-full max-w-[1120px] self-center p-5 pb-8 gap-5 lg:p-8">
        <View className="flex-row items-center gap-3">
          {region ? (
            <Pressable onPress={() => setRegion(null)} hitSlop={10} className="h-10 w-10 items-center justify-center rounded-full bg-surface">
              <Icon name="chevron-left" size={22} color={themeColor(theme, "ink")} />
            </Pressable>
          ) : null}
          <View className="flex-1">
            <Text className="text-[32px] font-black text-ink">{region === "World" ? "World Basics" : region ?? "Learn"}</Text>
            {!region ? <Text className="text-[15px] font-semibold text-muted">Structured paths, region by region.</Text> : null}
          </View>
        </View>

        {!region ? (
          <View className="gap-5">
            <View className="flex-row flex-wrap gap-2">
              {LEARN_TOPICS.map((t) => {
                const on = t.key === topic;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setTopic(t.key)}
                    className={`rounded-full border-2 px-5 py-2 ${on ? "border-primary bg-primary" : "border-line bg-surface"}`}
                  >
                    <Text className={`text-[15px] font-extrabold ${on ? "text-white" : "text-ink"}`}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="gap-3 md:flex-row md:flex-wrap md:justify-between">
              {regions.map((r) => {
                const done = r.lessons.filter((l) => progress.completedLessonIds.includes(l.id)).length;
                const pct = Math.round((done / r.lessons.length) * 100);
                return (
                  <Card key={r.name} onPress={() => setRegion(r.name)} className="flex-row items-center gap-4 md:w-[48.5%] xl:w-[32%]">
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-success/15">
                      <Text className="text-[15px] font-black text-success">{pct}%</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[19px] font-black text-ink">{r.name === "World" ? "World Basics" : r.name}</Text>
                      <Text className="font-bold text-muted">
                        {done}/{r.lessons.length} lessons
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={22} color={themeColor(theme, "muted")} />
                  </Card>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="gap-3 md:flex-row md:flex-wrap md:justify-between">
            {visible.map((lesson, i) => {
              const completed = progress.completedLessonIds.includes(lesson.id);
              return (
                <Card key={lesson.id} onPress={() => openLesson(lesson)} className="flex-row items-center gap-3 md:w-[48.5%]">
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-2xl ${completed ? "bg-primary" : "bg-surface"}`}
                  >
                    {completed ? (
                      <Icon name="check" size={24} color="#ffffff" />
                    ) : lesson.isTerritoryLesson ? (
                      <Icon name="star" size={22} color={themeColor(theme, "accent")} />
                    ) : (
                      <Text className="text-[18px] font-black text-ink">{i + 1}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-black text-ink" numberOfLines={1}>
                      {lesson.title}
                    </Text>
                    <Text className="text-[13px] font-semibold text-muted">
                      {lesson.countryCodes.length} {COUNT_LABELS[topic] ?? "flags"}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
