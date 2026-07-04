import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import { Card, PillButton, SectionLabel, softShadow } from "@/components/ui";
import { promptChallenge } from "@/social/challenge";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export default function ChallengeScreen() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <ScrollView contentContainerClassName="w-full max-w-[1120px] self-center p-5 pb-8 gap-5 lg:p-8">
        <View>
          <Text className="text-[32px] font-black text-ink">Challenge</Text>
          <Text className="text-[15px] font-semibold text-muted">Same round, head to head.</Text>
        </View>

        <View className="gap-5 lg:flex-row lg:items-start">
          {/* Hero */}
          <View style={softShadow} className="overflow-hidden rounded-card bg-primary p-5 lg:min-h-[280px] lg:flex-1 lg:justify-between lg:p-6">
            <View>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Icon name="flag" size={26} color="#ffffff" />
              </View>
              <Text className="mt-3 text-[26px] font-black text-white lg:text-[34px]">Challenge a friend</Text>
              <Text className="mt-1 text-[15px] font-semibold text-white/80 lg:max-w-[620px]">
                Send today's exact 5-question round. When you both finish, compare scores.
              </Text>
            </View>
            <View className="mt-4 lg:max-w-[320px]">
              <PillButton label="Create & share" variant="light" iconRight="share" onPress={() => void promptChallenge()} />
            </View>
          </View>

          <View className="gap-5 lg:w-[360px]">
            <View className="gap-3">
              <SectionLabel>Standings</SectionLabel>
              <LinkRow icon="users" label="Friends" sub="Win-loss with people you've played" onPress={() => router.push("/friends")} />
              <LinkRow icon="trophy" label="Leaderboard" sub="Daily & all-time XP" onPress={() => router.push("/leaderboard")} />
            </View>

            <Card className="gap-1">
              <Text className="text-[15px] font-black text-ink">How it works</Text>
              <Text className="text-[13px] font-semibold text-muted">
                1. Create a challenge and share the link.{"\n"}2. Your friend opens it — same questions, no login needed to play.
                {"\n"}3. Sign in to save your score and see who won.
              </Text>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LinkRow({
  icon,
  label,
  sub,
  onPress
}: {
  icon: IconName;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <Card onPress={onPress} className="flex-row items-center gap-3">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface">
        <Icon name={icon} size={22} color={themeColor(theme, "primary")} />
      </View>
      <View className="flex-1">
        <Text className="text-[17px] font-black text-ink">{label}</Text>
        <Text className="text-[13px] font-semibold text-muted">{sub}</Text>
      </View>
      <Icon name="chevron-right" size={22} color={themeColor(theme, "muted")} />
    </Card>
  );
}
