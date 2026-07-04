import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon from "@/components/Icon";
import { PillButton } from "@/components/ui";
import { useOnboardStore } from "@/state/onboarding";

export default function WelcomeScreen() {
  const markSeen = useOnboardStore((s) => s.markSeen);

  function go(to: string) {
    markSeen();
    router.replace(to as never);
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <View className="w-full max-w-[720px] flex-1 self-center items-center justify-center gap-4 px-8 lg:gap-5">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-primary lg:h-32 lg:w-32">
          <Icon name="globe" size={56} color="#ffffff" />
        </View>
        <Text className="text-[40px] font-black text-ink lg:text-[56px]">Worldly</Text>
        <Text className="text-center text-[13px] font-extrabold uppercase tracking-[2px] text-accent">
          Geography, but make it a daily duel
        </Text>
        <Text className="text-center text-[16px] font-semibold text-muted lg:max-w-[520px] lg:text-[18px]">
          A fresh geography challenge every day. Same for everyone. Beat your friends.
        </Text>
      </View>
      <View className="w-full max-w-[420px] self-center gap-3 px-5 pb-4 lg:pb-10">
        <PillButton
          label="Play today's challenge"
          variant="primary"
          iconRight="arrow-right"
          onPress={() => {
            markSeen();
            router.replace({ pathname: "/quiz", params: { mode: "daily" } });
          }}
        />
        <Pressable onPress={() => go("/")} hitSlop={8}>
          <Text className="text-center text-[15px] font-extrabold text-primary">Explore the app</Text>
        </Pressable>
        <Text className="text-center text-[13px] font-semibold text-muted">no sign-up · about 90 seconds</Text>
      </View>
    </SafeAreaView>
  );
}
