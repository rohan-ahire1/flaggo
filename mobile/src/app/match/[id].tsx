import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import Icon from "@/components/Icon";
import { Card, PillButton, SectionLabel } from "@/components/ui";
import { useAuth } from "@/auth/AuthProvider";
import { shareChallenge } from "@/social/challenge";
import { getMatch, getMatchResults, winnerFromResults } from "@/lib/matches";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export default function MatchScreen() {
  const { id, my } = useLocalSearchParams<{ id: string; my?: string }>();
  const { user } = useAuth();
  const theme = useThemeStore((s) => s.theme);

  const matchQ = useQuery({ queryKey: ["match", id], queryFn: () => getMatch(id), enabled: !!id });
  const resultsQ = useQuery({
    queryKey: ["match-results", id],
    queryFn: () => getMatchResults(id),
    enabled: !!id
  });

  const match = matchQ.data;
  const results = resultsQ.data ?? [];
  const myScore = my != null ? Number(my) : results.find((r) => r.user_id === user?.id)?.score ?? null;
  const played = myScore != null;

  if (matchQ.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator color={themeColor(theme, "primary")} />
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-paper p-8">
        <Icon name="users" size={40} color={themeColor(theme, "muted")} />
        <Text className="text-center text-lg font-black text-ink">Challenge unavailable</Text>
        <Text className="text-center font-semibold text-muted">
          {user ? "This challenge link is invalid or expired." : "Sign in to open challenges from friends."}
        </Text>
        <View className="w-48">
          <PillButton label="Back to Today" variant="primary" onPress={() => router.replace("/")} />
        </View>
      </SafeAreaView>
    );
  }

  const total = match.config.questionCount;
  const creator = results.find((r) => r.user_id === match.created_by);
  const opponent = results.find((r) => r.user_id !== user?.id) ?? creator ?? null;
  const outcome = winnerFromResults(results);
  const iWon = outcome?.type === "winner" && outcome.winner?.user_id === user?.id;

  // --- Received challenge (not yet played) ---
  if (!played) {
    return (
      <SafeAreaView className="flex-1 bg-primary" edges={["top", "bottom"]}>
        <View className="flex-1 justify-between p-6">
          <View />
          <Animated.View entering={FadeInDown} className="items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white/15">
              <Icon name="users" size={30} color="#ffffff" />
            </View>
            <Text className="text-center text-[26px] font-black text-white">
              {creator?.display_name ?? "A friend"} challenged you on Worldly
            </Text>
            <Text className="text-center text-[15px] font-semibold text-white/80">
              {creator ? `They scored ${creator.score}/${creator.total}. ` : ""}You'll get the exact same{" "}
              {total}-question round.
            </Text>
          </Animated.View>
          <View className="gap-3">
            <PillButton
              label="Play — no login"
              variant="light"
              iconRight="arrow-right"
              onPress={() =>
                router.replace({
                  pathname: "/quiz",
                  params: {
                    mode: "match",
                    matchId: id,
                    seed: match.seed,
                    config: JSON.stringify(match.config)
                  }
                })
              }
            />
            <Text className="text-center text-[13px] font-semibold text-white/70">takes about 90 seconds</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Score compare (played) ---
  const banner = iWon ? "You won! 🎉" : outcome?.type === "tie" ? "It's a tie!" : opponent ? "So close!" : "Round complete";
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="p-5 gap-5">
        <View className="items-center gap-1 pt-2">
          <SectionLabel>Head to head</SectionLabel>
          <Text className="text-[28px] font-black text-ink">{banner}</Text>
        </View>

        <View className="flex-row gap-3">
          <ScoreCard name="You" score={myScore} total={total} highlight={iWon} />
          <ScoreCard
            name={opponent?.display_name ?? "Waiting…"}
            score={opponent?.score ?? null}
            total={opponent?.total ?? total}
            highlight={outcome?.type === "winner" && !iWon}
          />
        </View>

        {!user ? (
          <Card className="flex-row items-center gap-3">
            <Icon name="user" size={22} color={themeColor(theme, "accent")} />
            <Text className="flex-1 font-semibold text-muted">Sign in to save your score and compare with friends.</Text>
          </Card>
        ) : null}

        <View className="gap-3">
          <PillButton
            label="Rematch"
            variant="primary"
            icon="swap"
            onPress={() =>
              router.replace({
                pathname: "/quiz",
                params: { mode: "match", matchId: id, seed: match.seed, config: JSON.stringify(match.config) }
              })
            }
          />
          <PillButton
            label="Share result card"
            variant="secondary"
            icon="share"
            onPress={() => void shareChallenge(match, myScore ?? undefined)}
          />
          <PillButton label="Back to Today" variant="secondary" onPress={() => router.replace("/")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreCard({
  name,
  score,
  total,
  highlight
}: {
  name: string;
  score: number | null;
  total: number;
  highlight?: boolean;
}) {
  return (
    <Card className={`flex-1 items-center gap-1 ${highlight ? "border-2 border-primary" : ""}`}>
      <Text className="text-[15px] font-extrabold text-muted" numberOfLines={1}>
        {name}
      </Text>
      <Text className="text-[34px] font-black text-ink">
        {score == null ? "—" : `${score}/${total}`}
      </Text>
    </Card>
  );
}
