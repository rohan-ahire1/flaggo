import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import { Card, Pill, PillButton, SectionLabel, softShadow } from "@/components/ui";
import { useEffect } from "react";
import { useProgress } from "@/state/ProgressProvider";
import { useOnboardStore } from "@/state/onboarding";
import { countries } from "@flaggo/core/data/countries";
import { DAILY_QUESTION_COUNT, dateKey } from "@flaggo/core/utils/dailyChallenge";
import { getDueCountries, getMasteredCountries, getWeakCountries } from "@flaggo/core/utils/spacedRepetition";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import type { Topic } from "@flaggo/core/types/topic";

const EXPLORE: { key: string; label: string; desc: string; icon: IconName; route: string }[] = [
  { key: "arcade", label: "Arcade", desc: "Beat the clock", icon: "bolt", route: "/arcade" },
  { key: "trivia", label: "Trivia", desc: "Quick-fire facts", icon: "sparkle", route: "/trivia" },
  { key: "map", label: "World map", desc: "Find countries", icon: "globe", route: "/map" },
  { key: "test", label: "Custom test", desc: "Test yourself", icon: "target", route: "/test-setup" },
  { key: "library", label: "Flag library", desc: "Browse every flag", icon: "library", route: "/library" },
  { key: "decks", label: "Decks", desc: "Build practice sets", icon: "star", route: "/decks" }
];

function hoursToMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.round((end.getTime() - now.getTime()) / 3600000));
}

export default function HomeScreen() {
  const { progress } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const onboard = useOnboardStore();

  useEffect(() => {
    if (onboard.hydrated && !onboard.seen) router.replace("/welcome");
  }, [onboard.hydrated, onboard.seen]);

  const today = dateKey();
  const doneToday = progress.daily.lastDate === today ? progress.daily.history[today] : undefined;
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const focusTopic: Topic = progress.selectedTopic === "location" ? "flag" : progress.selectedTopic;
  const focusCountries = focusTopic === "capital" ? countries.filter((c) => c.capital?.trim()) : countries;
  const dueCount = getDueCountries(progress, focusCountries, focusTopic).length;
  const weak = getWeakCountries(progress, focusCountries, focusTopic).slice(0, 3);
  const masteredCount = getMasteredCountries(progress, focusCountries, focusTopic).length;
  const masteryPct = Math.round((masteredCount / Math.max(1, focusCountries.length)) * 100);
  const answered = progress.totalCorrect + progress.totalWrong;
  const accuracyPct = answered ? Math.round((progress.totalCorrect / answered) * 100) : 0;
  const isNewUser = !Object.keys(progress.review).length && !progress.completedLessonIds.length;
  const nextLabel = isNewUser
    ? "Learn your first flags"
    : dueCount
      ? "Start review"
      : weak.length
        ? "Practice weak spots"
        : "Start quick round";
  const nextText = isNewUser
    ? "A 2-minute lesson to get going"
    : dueCount
      ? `${dueCount} ${focusTopic === "capital" ? "capitals" : "countries"} to review`
      : weak.length
        ? weak.map((country) => country.name).join(", ")
        : "Build today's first memory";

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <ScrollView contentContainerClassName="w-full max-w-[1120px] self-center p-5 pb-8 gap-5 lg:p-8">
        {/* Header */}
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-[32px] font-black text-ink">Today</Text>
            <Text className="text-[15px] font-semibold text-muted">{dateLabel}</Text>
          </View>
          <Pill icon="flame" label={String(progress.daily.streak ?? 0)} tone="accent" />
        </View>

        {/* Daily hero */}
        <View style={softShadow} className="overflow-hidden rounded-card bg-primary p-5">
          <View className="flex-row items-center justify-between">
            <SectionLabelOnDark>Daily challenge</SectionLabelOnDark>
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text className="text-[12px] font-bold text-white/80">resets in {hoursToMidnight()}h</Text>
            </View>
          </View>
          <Text className="mt-2 text-[30px] font-black text-white">Today's Five</Text>
          <Text className="mt-1 text-[15px] font-semibold text-white/80">
            {DAILY_QUESTION_COUNT} mixed questions · same for everyone, everywhere
          </Text>

          <View className="mt-4 flex-row gap-1.5">
            {Array.from({ length: DAILY_QUESTION_COUNT }).map((_, i) => (
              <View
                key={i}
                className={`h-1.5 flex-1 rounded-full ${doneToday && i < doneToday.score ? "bg-accent" : "bg-white/25"}`}
              />
            ))}
          </View>

          <View className="mt-4">
            <PillButton
              label={doneToday ? "Play again" : "Play today's Five"}
              variant="light"
              iconRight="arrow-right"
              onPress={() => router.push({ pathname: "/quiz", params: { mode: "daily" } })}
            />
          </View>

          <Text className="mt-3 text-center text-[13px] font-semibold text-white/70">
            {doneToday ? `You scored ${doneToday.score}/${doneToday.total} today` : `Same ${DAILY_QUESTION_COUNT} questions for everyone today`}
          </Text>
        </View>

        {/* Progress pulse */}
        <Card className="gap-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <SectionLabel>{isNewUser ? "Start here" : "Keep going"}</SectionLabel>
              <Text className="mt-1 text-[24px] font-black text-ink">{nextLabel}</Text>
              <Text className="mt-1 text-[14px] font-semibold text-muted">{nextText}</Text>
            </View>
            {!isNewUser ? (
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Text className="text-[24px] font-black text-primary">{masteryPct}%</Text>
                <Text className="text-[10px] font-extrabold uppercase text-primary">mastered</Text>
              </View>
            ) : null}
          </View>
          {!isNewUser ? (
            <View className="flex-row gap-2">
              <Pill icon="review" label={`${dueCount} due`} tone={dueCount ? "accent" : "muted"} />
              <Pill icon="target" label={answered ? `${accuracyPct}% accuracy` : "New learner"} tone="success" />
            </View>
          ) : null}
          <PillButton
            label={isNewUser ? "Start lesson" : nextLabel}
            variant="primary"
            iconRight="arrow-right"
            onPress={() =>
              !isNewUser && (dueCount || weak.length)
                ? router.push("/review")
                : router.push({ pathname: "/quiz", params: { mode: "lesson", topic: focusTopic } })
            }
          />
        </Card>

        {/* Explore */}
        <View className="gap-3">
          <SectionLabel>Explore</SectionLabel>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {EXPLORE.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.route as never)}
                style={softShadow}
                className="w-[48%] rounded-[20px] border border-line bg-paper p-4 md:w-[32%]"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface">
                  <Icon name={item.icon} size={22} color={themeColor(theme, "primary")} />
                </View>
                <Text className="mt-3 text-[16px] font-black text-ink">{item.label}</Text>
                <Text className="mt-1 text-[12px] font-semibold text-muted">{item.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabelOnDark({ children }: { children: ReactNode }) {
  return <Text className="text-[13px] font-extrabold uppercase tracking-[2px] text-white/70">{children}</Text>;
}
