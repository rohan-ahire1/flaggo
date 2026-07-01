import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import { Card, Pill, PillButton, SectionLabel, softShadow } from "@/components/ui";
import { useEffect } from "react";
import { useProgress } from "@/state/ProgressProvider";
import { useOnboardStore } from "@/state/onboarding";
import { promptChallenge } from "@/social/challenge";
import { dateKey } from "@/utils/dailyChallenge";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import type { Topic } from "@/types/topic";

const QUICK: { key: string; label: string; icon: IconName; topic?: Topic; route?: string }[] = [
  { key: "flag", label: "Flags", icon: "flag", topic: "flag" },
  { key: "capital", label: "Capitals", icon: "map-pin", topic: "capital" },
  { key: "map", label: "Find on map", icon: "globe", route: "/map" },
  { key: "trivia", label: "Trivia", icon: "sparkle", route: "/trivia" }
];

const MORE: { key: string; label: string; icon: IconName; route: string }[] = [
  { key: "leaderboard", label: "Leaderboard", icon: "trophy", route: "/leaderboard" },
  { key: "library", label: "Flag library", icon: "library", route: "/library" },
  { key: "decks", label: "Decks", icon: "layers", route: "/decks" },
  { key: "stats", label: "Stats", icon: "stats", route: "/stats" }
];

const FRIEND_AVATARS = [
  { name: "Mia", color: "#c9b79a" },
  { name: "Leo", color: "#a9bcc4" },
  { name: "Ada", color: "#cdb9c4" }
];

function hoursToMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
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

  function quickPlay(item: (typeof QUICK)[number]) {
    if (item.route) {
      router.push(item.route as never);
    } else if (item.topic) {
      router.push({ pathname: "/quiz", params: { mode: "lesson", topic: item.topic } });
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <ScrollView contentContainerClassName="p-5 pb-8 gap-5">
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
            5 mixed questions · same for everyone, everywhere
          </Text>

          <View className="mt-4 flex-row gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
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
            {doneToday ? `You scored ${doneToday.score}/${doneToday.total} today` : "12,438 playing today"}
          </Text>
        </View>

        {/* Challenge a friend */}
        <Card onPress={() => void promptChallenge()} className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent">
            <Icon name="users" size={22} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-black text-ink">Challenge a friend</Text>
            <Text className="text-[13px] font-semibold text-muted">Send today's exact round & compare</Text>
          </View>
          <Icon name="chevron-right" size={22} color={themeColor(theme, "muted")} />
        </Card>

        {/* Quick play */}
        <View className="gap-3">
          <SectionLabel>Quick play</SectionLabel>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {QUICK.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => quickPlay(item)}
                style={softShadow}
                className="w-[48%] rounded-[20px] border border-line bg-paper p-4"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface">
                  <Icon name={item.icon} size={22} color={themeColor(theme, "primary")} />
                </View>
                <Text className="mt-3 text-[17px] font-black text-ink">{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Friends today */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <SectionLabel>Friends</SectionLabel>
            <Pressable onPress={() => router.push("/leaderboard")} hitSlop={8}>
              <Text className="text-[13px] font-extrabold text-primary">See all</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-4">
            {FRIEND_AVATARS.map((f) => (
              <Pressable key={f.name} onPress={() => router.push("/friends")} className="items-center gap-1.5">
                <View className="h-[52px] w-[52px] rounded-full border-2 border-line" style={{ backgroundColor: f.color }} />
                <Text className="text-[12px] font-bold text-ink">{f.name}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => void promptChallenge()} className="items-center gap-1.5">
              <View className="h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-dashed border-muted">
                <Icon name="plus" size={22} color={themeColor(theme, "muted")} />
              </View>
              <Text className="text-[12px] font-bold text-muted">Invite</Text>
            </Pressable>
          </View>
        </View>

        {/* More */}
        <View className="gap-3">
          <SectionLabel>More</SectionLabel>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {MORE.map((item) => (
              <Card key={item.key} onPress={() => router.push(item.route as never)} className="w-[48%] flex-row items-center gap-2.5">
                <Icon name={item.icon} size={22} color={themeColor(theme, "muted")} />
                <Text className="text-[15px] font-black text-ink">{item.label}</Text>
              </Card>
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
