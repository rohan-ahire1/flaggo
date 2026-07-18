import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon, { type IconName } from "@/components/Icon";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Card, PillButton, SectionLabel } from "@/components/ui";
import {
  deleteAccount,
  resetPasswordForEmail,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  signUpWithUsername
} from "@/auth/actions";
import { useAuth } from "@/auth/AuthProvider";
import { hasSupabaseConfig } from "@/lib/supabase";
import { isSyntheticEmail, isValidUsername } from "@/lib/username";
import { isStreakReminderEnabled, setStreakReminderEnabled, syncStreakReminder } from "@/lib/streakReminder";
import { useProgress } from "@/state/ProgressProvider";
import { isMasteredReview } from "@flaggo/core/utils/spacedRepetition";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import { BADGES } from "@flaggo/core/game/badges";

export default function ProfileScreen() {
  const { user, displayName } = useAuth();
  const { progress, resetAllProgress, syncState } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const mastered = Object.values(progress.review).filter(isMasteredReview).length;
  const earnedBadges = new Map(progress.badges.map((badge) => [badge.id, badge]));
  const earnedCount = BADGES.filter((badge) => earnedBadges.has(badge.id)).length;
  const accuracy =
    progress.totalCorrect + progress.totalWrong > 0
      ? Math.round((progress.totalCorrect / (progress.totalCorrect + progress.totalWrong)) * 100)
      : 0;
  const name = displayName ?? (user ? "Flaggo learner" : "Guest");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [signupName, setSignupName] = useState("");
  const [usernameOnly, setUsernameOnly] = useState(false);
  const [password, setPassword] = useState("");
  const syncLabel = syncState === "local" ? "Saved on device" : syncState === "loading" || syncState === "saving" ? "Syncing..." : syncState === "saved" ? "Synced" : "Sync issue";
  const synthetic = isSyntheticEmail(user?.email);

  useEffect(() => {
    void isStreakReminderEnabled().then(setReminderEnabled).catch(() => undefined);
  }, []);

  async function submitAuth() {
    setBusy(true);
    setNotice(null);
    try {
      let result: { error?: string; message?: string };
      if (authMode === "signin") {
        result = await signInWithPassword(email, password);
      } else if (usernameOnly) {
        if (!isValidUsername(signupName)) {
          result = { error: "Use 3-20 letters, numbers, or underscores." };
        } else {
          result = await signUpWithUsername(signupName, password);
        }
      } else {
        result = await signUpWithPassword(email, password, signupName);
      }
      setNotice(result.error ?? result.message ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    setBusy(true);
    setNotice(null);
    try {
      const { error, message } = await resetPasswordForEmail(email);
      setNotice(error ?? message ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function toggleReminder(on: boolean) {
    setReminderEnabled(on);
    await setStreakReminderEnabled(on);
    await syncStreakReminder(progress);
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

  function confirmDeleteAccount() {
    const run = async () => {
      setBusy(true);
      setNotice(null);
      try {
        const { error } = await deleteAccount();
        if (error) {
          setNotice(error);
          return;
        }
        await resetAllProgress();
        setNotice("Account deleted");
      } finally {
        setBusy(false);
      }
    };

    const message = "This removes your synced progress permanently.";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`Delete account?\n\n${message}`)) void run();
      return;
    }
    Alert.alert("Delete account?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void run() }
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
                {synthetic ? "Username account · no email" : user?.email ??
                  (hasSupabaseConfig
                    ? "Sign in to sync progress"
                    : "Playing locally · progress saved on this device")}
              </Text>
            </View>
            <View className="rounded-full border border-line bg-surface px-3 py-1">
              <Text className="text-[12px] font-bold text-muted">{syncLabel}</Text>
            </View>
          </View>

          {user ? (
            <PillButton label="Sign out" variant="secondary" onPress={() => void signOut()} />
          ) : hasSupabaseConfig ? (
            <View className="gap-3">
              <View className="flex-row gap-2">
                <PillButton label="Sign in" variant={authMode === "signin" ? "primary" : "secondary"} onPress={() => setAuthMode("signin")} className="flex-1" />
                <PillButton label="Create account" variant={authMode === "signup" ? "primary" : "secondary"} onPress={() => setAuthMode("signup")} className="flex-1" />
              </View>
              {authMode === "signup" ? (
                <>
                  <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
                    <View className="flex-1">
                      <Text className="text-[15px] font-black text-ink">Username only</Text>
                      <Text className="text-[12px] font-semibold text-muted">No email</Text>
                    </View>
                    <Switch value={usernameOnly} onValueChange={setUsernameOnly} disabled={busy} />
                  </View>
                  <TextInput
                    value={signupName}
                    onChangeText={setSignupName}
                    placeholder="Username"
                    placeholderTextColor={themeColor(theme, "muted")}
                    autoCapitalize="none"
                    editable={!busy}
                    maxLength={32}
                    className="rounded-2xl border-2 border-line bg-paper px-4 py-3 text-[16px] font-semibold text-ink"
                  />
                </>
              ) : null}
              {authMode === "signup" && usernameOnly ? null : (
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
              )}
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={themeColor(theme, "muted")}
                autoCapitalize="none"
                secureTextEntry
                editable={!busy}
                className="rounded-2xl border-2 border-line bg-paper px-4 py-3 text-[16px] font-semibold text-ink"
              />
              <PillButton label={authMode === "signin" ? "Sign in" : "Create account"} variant="primary" onPress={submitAuth} />
              {authMode === "signin" ? (
                <Pressable onPress={forgotPassword} disabled={busy || !email.trim()}>
                  <Text className="text-center text-[14px] font-black text-primary">Forgot password?</Text>
                </Pressable>
              ) : null}
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

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <SectionLabel>Achievements</SectionLabel>
            <View className="rounded-full border border-line bg-surface px-3 py-1">
              <Text className="text-[12px] font-bold text-muted">{earnedCount} of {BADGES.length}</Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2.5">
            {BADGES.map((badge) => {
              const earned = earnedBadges.get(badge.id);
              const icon = (badge.icon === "pin" ? "map-pin" : badge.icon) as IconName;
              return (
                <Card key={badge.id} className={`w-[31%] items-center gap-1 p-2.5 ${earned ? "" : "bg-surface opacity-60"}`}>
                  <View className={`h-11 w-11 items-center justify-center rounded-2xl ${earned ? "bg-primary/10" : "bg-paper"}`}>
                    <Icon name={icon} size={22} color={themeColor(theme, earned ? "primary" : "muted")} />
                  </View>
                  <Text className={`min-h-9 text-center text-[13px] font-black leading-tight ${earned ? "text-ink" : "text-muted"}`}>
                    {badge.name}
                  </Text>
                  <Text className="min-h-9 text-center text-[10px] font-bold leading-tight text-muted">
                    {earned ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(earned.earnedAt)) : badge.hint}
                  </Text>
                </Card>
              );
            })}
          </View>
        </View>

        {/* Social */}
        <View className="gap-3 lg:w-[48%]">
          <SectionLabel>Compete</SectionLabel>
        </View>

        {/* Appearance */}
        <View className="gap-3">
          <SectionLabel>Reminders</SectionLabel>
          <Card className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-[17px] font-black text-ink">Daily streak reminder</Text>
              <Text className="text-[13px] font-semibold text-muted">7 pm</Text>
            </View>
            <Switch value={reminderEnabled} onValueChange={(value) => void toggleReminder(value)} />
          </Card>
        </View>

        {/* Appearance */}
        <View className="gap-3">
          <SectionLabel>Appearance</SectionLabel>
          <Card className="gap-3">
            <Text className="text-[13px] font-semibold text-muted">Re-themes every screen instantly.</Text>
            <ThemeSwitcher />
          </Card>
        </View>

        <View className="gap-3">
          <PillButton label="Reset progress" variant="secondary" onPress={confirmReset} className="border-error/40" />
          {user ? (
            <View className="gap-2">
              <SectionLabel>Danger zone</SectionLabel>
              <Pressable onPress={confirmDeleteAccount} disabled={busy} className="items-center rounded-2xl px-5 py-4">
                <Text className="font-black text-error">Delete my account & data</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
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
