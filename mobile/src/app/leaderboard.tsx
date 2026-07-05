import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { dismiss } from "@/utils/nav";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/Icon";
import { Card, SectionLabel } from "@/components/ui";
import { dailyBoard, fetchTopScores, triviaBoard, xpBoard } from "@/lib/leaderboard";
import { dateKey } from "@flaggo/core/utils/dailyChallenge";
import type { TriviaMode } from "@flaggo/core/utils/trivia";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

type Tab = "daily" | "trivia" | "xp";

const TRIVIA: { mode: TriviaMode; label: string }[] = [
  { mode: "higher-lower", label: "Higher/Lower" },
  { mode: "odd-one-out", label: "Odd one out" },
  { mode: "true-false", label: "True/False" }
];

export default function LeaderboardScreen() {
  const theme = useThemeStore((s) => s.theme);
  const [tab, setTab] = useState<Tab>("daily");
  const [triviaMode, setTriviaMode] = useState<TriviaMode>("higher-lower");
  const board = tab === "daily" ? dailyBoard(dateKey()) : tab === "trivia" ? triviaBoard(triviaMode) : xpBoard();
  const q = useQuery({ queryKey: ["leaderboard", board], queryFn: () => fetchTopScores(board) });
  const rows = q.data ?? [];
  const heading = tab === "daily" ? "Today's five" : tab === "trivia" ? TRIVIA.find((item) => item.mode === triviaMode)?.label ?? "Trivia" : "Total XP";

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-3 px-5 py-3">
        <Pressable onPress={() => dismiss()} hitSlop={10}>
          <Icon name="x" size={24} color={themeColor(theme, "muted")} />
        </Pressable>
        <Text className="text-[22px] font-black text-ink">Leaderboard</Text>
      </View>

      <View className="mx-5 mb-3 flex-row rounded-2xl bg-surface p-1 lg:mx-auto lg:w-full lg:max-w-[720px]">
        {(["daily", "trivia", "xp"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`flex-1 items-center rounded-xl py-2.5 ${tab === t ? "bg-primary" : ""}`}
          >
            <Text className={`text-[15px] font-extrabold ${tab === t ? "text-white" : "text-muted"}`}>
              {t === "daily" ? "Today" : t === "trivia" ? "Trivia" : "All-time XP"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerClassName="w-full max-w-[720px] self-center px-5 pb-8 gap-4 lg:px-8">
        {tab === "trivia" ? (
          <View className="flex-row gap-2">
            {TRIVIA.map((item) => (
              <Pressable
                key={item.mode}
                onPress={() => setTriviaMode(item.mode)}
                className={`rounded-full border px-3 py-2 ${triviaMode === item.mode ? "border-primary bg-primary" : "border-line bg-paper"}`}
              >
                <Text className={`text-[13px] font-extrabold ${triviaMode === item.mode ? "text-white" : "text-muted"}`}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <SectionLabel>{heading}</SectionLabel>
        {q.isLoading ? (
          <ActivityIndicator color={themeColor(theme, "primary")} />
        ) : rows.length === 0 ? (
          <Card className="items-center gap-2 py-8">
            <Icon name="trophy" size={36} color={themeColor(theme, "muted")} />
            <Text className="text-center text-[16px] font-black text-ink">No scores yet</Text>
            <Text className="text-center font-semibold text-muted">
              Play a round and sign in to appear on the board.
            </Text>
          </Card>
        ) : (
          <Card className="gap-0 p-0">
            {rows.map((r, i) => (
              <View
                key={`${r.rank}-${r.display_name}`}
                className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-line" : ""} ${r.is_me ? "bg-primary/10" : ""}`}
              >
                <Text className="w-7 text-[16px] font-black text-muted">{r.rank}</Text>
                <Text className="flex-1 text-[16px] font-extrabold text-ink">
                  {r.display_name}
                  {r.is_me ? <Text className="font-bold text-primary"> · you</Text> : null}
                </Text>
                <Text className="text-[16px] font-black text-primary">{r.score}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
