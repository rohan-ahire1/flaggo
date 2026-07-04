import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { dismiss } from "@/utils/nav";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/Icon";
import { Card, PillButton, SectionLabel } from "@/components/ui";
import { useAuth } from "@/auth/AuthProvider";
import { getFriendsLeaderboard } from "@/lib/matches";
import { promptChallenge } from "@/social/challenge";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export default function FriendsScreen() {
  const { user } = useAuth();
  const theme = useThemeStore((s) => s.theme);
  const q = useQuery({ queryKey: ["friends"], queryFn: getFriendsLeaderboard, enabled: !!user });
  const rows = q.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <View className="w-full max-w-[960px] self-center flex-row items-center gap-3 px-5 py-3 lg:px-8">
        <Pressable onPress={() => dismiss()} hitSlop={10}>
          <Icon name="x" size={24} color={themeColor(theme, "muted")} />
        </Pressable>
        <Text className="text-[22px] font-black text-ink">Friends</Text>
      </View>
      <ScrollView contentContainerClassName="w-full max-w-[960px] self-center px-5 pb-8 gap-4 lg:px-8">
        <SectionLabel>Match standings</SectionLabel>
        {!user ? (
          <EmptyState
            icon="user"
            title="Sign in to see friends"
            body="Friends are added automatically when you play a challenge together."
            action={() => router.replace("/(tabs)/profile")}
            actionLabel="Go to sign in"
          />
        ) : q.isLoading ? (
          <ActivityIndicator color={themeColor(theme, "primary")} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="users"
            title="No friends yet"
            body="Challenge someone from Today — once you both finish a round, they'll show up here."
            action={() => router.replace("/")}
            actionLabel="Challenge a friend"
          />
        ) : (
          <View className="gap-3 lg:flex-row lg:items-start">
            <Card className="gap-0 p-0 lg:flex-1">
              {rows.map((r, i) => (
                <View
                  key={r.handle + r.rank}
                  className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <Text className="w-7 text-[16px] font-black text-muted">{r.rank}</Text>
                  <View className="flex-1">
                    <Text className="text-[16px] font-extrabold text-ink">{r.handle}</Text>
                    <Text className="text-[13px] font-semibold text-muted">
                      {r.wins} wins · {r.matches_played} played
                    </Text>
                  </View>
                  <Text className="text-[16px] font-black text-primary">{r.total_score}</Text>
                </View>
              ))}
            </Card>
            <View className="gap-3 lg:w-[300px]">
              <PillButton label="Challenge a friend" variant="primary" icon="users" onPress={() => void promptChallenge()} />
              <PillButton label="Leaderboard" variant="secondary" icon="trophy" onPress={() => router.push("/leaderboard")} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
  actionLabel
}: {
  icon: "user" | "users";
  title: string;
  body: string;
  action: () => void;
  actionLabel: string;
}) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <Card className="items-center gap-3 py-8">
      <Icon name={icon} size={36} color={themeColor(theme, "muted")} />
      <Text className="text-center text-[18px] font-black text-ink">{title}</Text>
      <Text className="text-center font-semibold text-muted">{body}</Text>
      <View className="mt-1 w-52">
        <PillButton label={actionLabel} variant="primary" onPress={action} />
      </View>
    </Card>
  );
}
