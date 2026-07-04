import { useState } from "react";
import { Alert, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Card, PillButton, SectionLabel } from "@/components/ui";
import { signInWithEmail, signInWithGoogle, signOut } from "@/auth/actions";
import { useAuth } from "@/auth/AuthProvider";
import { hasSupabaseConfig } from "@/lib/supabase";
import { useProgress } from "@/state/ProgressProvider";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export default function ProfileScreen() {
  const { user, displayName } = useAuth();
  const { progress, resetAllProgress, syncState } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const mastered = Object.values(progress.review).filter((r) => r.box >= 5).length;
  const accuracy =
    progress.totalCorrect + progress.totalWrong > 0
      ? Math.round((progress.totalCorrect / (progress.totalCorrect + progress.totalWrong)) * 100)
      : 0;
  const name = displayName ?? (user ? "Flaggo learner" : "Guest");

  async function google() {
    setBusy(true);
    setNotice(null);
    const { error } = await signInWithGoogle();
    if (error) setNotice(error);
    setBusy(false);
  }

  async function magicLink() {
    setBusy(true);
    setNotice(null);
    const { error, message } = await signInWithEmail(email);
    setNotice(error ?? message ?? null);
    setBusy(false);
  }

  function confirmReset() {
    // Alert.alert is a no-op on react-native-web, so use window.confirm there.
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Reset progress?\n\nThis clears your local progress.")) {
        void resetAllProgress();
      }
      return;
    }
    Alert.alert("Reset progress?", "This clears your local progress.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => void resetAllProgress() }
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <ScrollView contentContainerClassName="w-full max-w-[1120px] self-center p-5 pb-8 gap-5 lg:p-8">
        <Text className="text-[32px] font-black text-ink">You</Text>

        {/* Identity */}
        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
              <Text className="text-[22px] font-black text-white">{name.charAt(0).toUpperCase()}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[19px] font-black text-ink">{name}</Text>
              <Text className="text-[13px] font-semibold text-muted">
                {user?.email ??
                  (hasSupabaseConfig
                    ? "Sign in to sync progress"
                    : "Playing locally · progress saved on this device")}
              </Text>
            </View>
            <View className="rounded-full border border-line bg-surface px-3 py-1">
              <Text className="text-[12px] font-bold text-muted">sync: {syncState}</Text>
            </View>
          </View>

          {user ? (
            <PillButton label="Sign out" variant="secondary" onPress={() => void signOut()} />
          ) : hasSupabaseConfig ? (
            <View className="gap-3">
              <PillButton label="Continue with Google" variant="primary" onPress={google} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor={themeColor(theme, "muted")}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!busy}
                className="rounded-2xl border-2 border-line bg-paper px-4 py-3 text-[16px] font-semibold text-ink"
              />
              <PillButton label="Email me a sign-in link" variant="secondary" onPress={magicLink} />
              {notice ? <Text className="font-bold text-primary">{notice}</Text> : null}
            </View>
          ) : null}
        </Card>

        {/* Stats */}
        <View className="flex-row gap-3 lg:w-[48%]">
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Mastered" value={`${mastered}`} />
          <Stat label="XP" value={`${progress.xp}`} />
        </View>

        {/* Social */}
        <View className="gap-3 lg:w-[48%]">
          <SectionLabel>Compete</SectionLabel>
          <LinkRow icon="users" label="Friends" sub="Head-to-head standings" onPress={() => router.push("/friends")} />
          <LinkRow icon="trophy" label="Leaderboard" sub="Daily & all-time XP" onPress={() => router.push("/leaderboard")} />
        </View>

        {/* Appearance */}
        <View className="gap-3">
          <SectionLabel>Appearance</SectionLabel>
          <Card className="gap-3">
            <Text className="text-[13px] font-semibold text-muted">Re-themes every screen instantly.</Text>
            <ThemeSwitcher />
          </Card>
        </View>

        <PillButton label="Reset progress" variant="secondary" onPress={confirmReset} className="border-error/40" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1 items-center gap-0.5 p-3">
      <Text className="text-[22px] font-black text-ink">{value}</Text>
      <Text className="text-[12px] font-bold uppercase tracking-wide text-muted">{label}</Text>
    </Card>
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
