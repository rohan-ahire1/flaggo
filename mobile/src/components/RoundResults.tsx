import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import Icon, { type IconName } from "./Icon";
import FlagImage from "./FlagImage";
import { Card, PillButton, ScoreRing, SectionLabel } from "./ui";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export type RoundResultItem = {
  label: string;
  correct: boolean;
  chosen?: string;
  answer?: string;
  countryCode?: string;
  countryName?: string;
  context?: string;
};
export type ResultAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  icon?: IconName;
};

export type EarnedBadgeResult = {
  id: string;
  name: string;
  icon: IconName;
};

function title(score: number, total: number) {
  if (total > 0 && score === total) return "Perfect round!";
  if (score / Math.max(1, total) >= 0.5) return "Great round!";
  return "Keep practising!";
}

export default function RoundResults({
  score,
  total,
  items,
  streak,
  caption,
  earnedBadges,
  actions
}: {
  score: number;
  total: number;
  items: RoundResultItem[];
  streak?: number;
  caption?: string;
  earnedBadges?: EarnedBadgeResult[];
  actions: ResultAction[];
}) {
  const theme = useThemeStore((s) => s.theme);
  const missed = items.filter((item) => !item.correct).length;
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <View className="w-full max-w-[820px] flex-1 gap-4 self-center p-5 lg:p-8">
        {/* Hero */}
        <Animated.View entering={ZoomIn.springify()} className="items-center gap-2 pt-1">
          <SectionLabel>Round complete</SectionLabel>
          <Text className="text-[26px] font-black text-ink">{title(score, total)}</Text>
          <ScoreRing score={score} total={total} caption={caption} />
        </Animated.View>

        {typeof streak === "number" ? (
          <Card className="flex-row items-center gap-3 py-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <Icon name="flame" size={20} color={themeColor(theme, "accent")} />
            </View>
            <Text className="text-[16px] font-extrabold text-ink">
              {streak} day streak <Text className="font-bold text-muted">· +1 today</Text>
            </Text>
          </Card>
        ) : null}

        {earnedBadges?.length ? (
          <Animated.View entering={FadeInUp.duration(220)}>
            <Card className="flex-row items-center gap-3 border-primary/30 bg-primary/10 py-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
                <Icon name="trophy" size={21} color="white" />
              </View>
              <View className="flex-1">
                <SectionLabel>Badge earned!</SectionLabel>
                <Text className="text-[17px] font-extrabold text-ink">
                  {earnedBadges.map((badge) => badge.name).join(", ")}
                </Text>
              </View>
              <Icon name={earnedBadges[0].icon} size={22} color={themeColor(theme, "primary")} />
            </Card>
          </Animated.View>
        ) : null}

        <Card className="flex-row items-center gap-3 py-3">
          <View className={`h-10 w-10 items-center justify-center rounded-full ${missed ? "bg-accent/20" : "bg-success/20"}`}>
            <Icon
              name={missed ? "target" : "check"}
              size={20}
              color={themeColor(theme, missed ? "accent" : "success")}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[16px] font-extrabold text-ink">
              {missed ? `${missed} to review next` : "No misses to review"}
            </Text>
            <Text className="text-[13px] font-semibold text-muted">
              {missed ? "Your review queue now knows what to bring back." : "Keep the streak alive with another short round."}
            </Text>
          </View>
        </Card>

        {/* Review list — the only region that scrolls, and only if it overflows */}
        <Card className="min-h-0 flex-1 gap-0 overflow-hidden p-0">
          <View className="flex-row items-center justify-between px-4 pb-3 pt-4">
            <SectionLabel>Review</SectionLabel>
            <Text className="text-[13px] font-bold text-muted">
              {score}/{total} correct
            </Text>
          </View>
          <ScrollView className="flex-1" contentContainerClassName="pb-1">
            {items.map((it, i) => (
              <Animated.View key={i} entering={i < 10 ? FadeInUp.delay(i * 30) : undefined} className="flex-row items-start gap-3 border-t border-line px-4 py-3">
                {it.countryCode ? (
                  <View className="mt-0.5 w-12">
                    <FlagImage code={it.countryCode} width={120} className="rounded-lg" />
                  </View>
                ) : (
                  <View
                    className={`mt-0.5 h-7 w-7 items-center justify-center rounded-full ${it.correct ? "bg-success/20" : "bg-error/20"}`}
                  >
                    <Icon
                      name={it.correct ? "check" : "x"}
                      size={15}
                      color={themeColor(theme, it.correct ? "success" : "error")}
                    />
                  </View>
                )}
                <View className="flex-1 gap-1">
                  <View className="flex-row items-start gap-2">
                    <Text className="flex-1 text-[16px] font-bold text-ink">{it.label}</Text>
                    <Icon
                      name={it.correct ? "check" : "x"}
                      size={16}
                      color={themeColor(theme, it.correct ? "success" : "error")}
                    />
                  </View>
                  {it.context ? <Text className="text-[12px] font-semibold text-muted">{it.context}</Text> : null}
                  {!it.correct && (it.chosen || it.answer) ? (
                    <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
                      {it.chosen ? (
                        <Text className="text-[13px] font-semibold text-error">You: {it.chosen}</Text>
                      ) : null}
                      {it.answer ? (
                        <Text className="text-[13px] font-semibold text-success">Answer: {it.answer}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </Card>

        {/* Actions — pinned; always visible without scrolling */}
        <View className="gap-2.5">
          {actions.map((a, i) => (
            <PillButton
              key={i}
              label={a.label}
              onPress={a.onPress}
              variant={a.variant ?? "secondary"}
              icon={a.icon}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
