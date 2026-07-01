import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Icon, { type IconName } from "./Icon";
import { Card, PillButton, ScoreRing, SectionLabel } from "./ui";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export type RoundResultItem = { label: string; correct: boolean; chosen?: string };
export type ResultAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  icon?: IconName;
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
  actions
}: {
  score: number;
  total: number;
  items: RoundResultItem[];
  streak?: number;
  caption?: string;
  actions: ResultAction[];
}) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="p-5 gap-5">
        <Animated.View entering={FadeInDown.duration(260)} className="items-center gap-4 pt-2">
          <SectionLabel>Round complete</SectionLabel>
          <Text className="text-[28px] font-black text-ink">{title(score, total)}</Text>
          <ScoreRing score={score} total={total} caption={caption} />
        </Animated.View>

        {/* Per-question pips */}
        <View className="flex-row flex-wrap justify-center gap-2">
          {items.map((it, i) => (
            <View
              key={i}
              className={`h-9 w-9 items-center justify-center rounded-full border-2 ${it.correct ? "border-success bg-success/20" : "border-error bg-error/20"}`}
            >
              <Icon
                name={it.correct ? "check" : "x"}
                size={16}
                color={themeColor(theme, it.correct ? "success" : "error")}
              />
            </View>
          ))}
        </View>

        {typeof streak === "number" ? (
          <Card className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-accent/20">
              <Icon name="flame" size={22} color={themeColor(theme, "accent")} />
            </View>
            <Text className="text-[17px] font-extrabold text-ink">
              {streak} day streak <Text className="font-bold text-muted">· +1 today</Text>
            </Text>
          </Card>
        ) : null}

        {/* Review list */}
        <Card className="gap-0 p-0">
          {items.map((it, i) => (
            <View
              key={i}
              className={`flex-row items-center justify-between px-4 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
            >
              <Text className="flex-1 pr-3 text-[16px] font-bold text-ink" numberOfLines={1}>
                {it.label}
              </Text>
              {it.correct ? (
                <Icon name="check" size={20} color={themeColor(theme, "success")} />
              ) : (
                <View className="flex-row items-center gap-1.5">
                  {it.chosen ? (
                    <Text className="text-[13px] font-semibold text-error" numberOfLines={1}>
                      chose {it.chosen}
                    </Text>
                  ) : null}
                  <Icon name="x" size={20} color={themeColor(theme, "error")} />
                </View>
              )}
            </View>
          ))}
        </Card>

        <View className="gap-3">
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
      </ScrollView>
    </SafeAreaView>
  );
}
