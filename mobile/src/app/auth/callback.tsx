import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { createSessionFromUrl } from "@/auth/actions";
import { PillButton } from "@/components/ui";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export default function AuthCallbackScreen() {
  const theme = useThemeStore((s) => s.theme);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function finish() {
      const url = Linking.getLinkingURL();
      const result = url ? await createSessionFromUrl(url) : {};
      if (!active) return;
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace("/(tabs)/profile");
    }

    void finish();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 justify-center bg-paper" edges={["top", "bottom"]}>
      {error ? (
        <View className="w-full max-w-[420px] self-center gap-4 px-5">
          <Text className="text-center text-[22px] font-black text-ink">Sign-in could not finish</Text>
          <Text className="text-center font-semibold text-muted">{error}</Text>
          <PillButton label="Back to profile" variant="primary" onPress={() => router.replace("/(tabs)/profile")} />
        </View>
      ) : (
        <View className="w-full max-w-[420px] self-center items-center gap-3 px-5">
          <ActivityIndicator color={themeColor(theme, "primary")} />
          <Text className="font-semibold text-muted">Finishing sign-in...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
