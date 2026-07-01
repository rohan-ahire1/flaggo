import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import { PillButton, SectionLabel } from "@/components/ui";
import { countries } from "@/data/countries";
import { useProgress } from "@/state/ProgressProvider";
import { getPopularityGroups } from "@/utils/popularity";
import type { Topic } from "@/types/topic";

type TestMode = "recall" | "options";

export default function TestSetupScreen() {
  const { progress } = useProgress();
  const [topic, setTopic] = useState<Topic>(progress.selectedTopic === "capital" ? "capital" : "flag");
  const [mode, setMode] = useState<TestMode>("recall");
  const topicCountries = useMemo(
    () => (topic === "capital" ? countries.filter((c) => c.capital?.trim()) : countries),
    [topic]
  );
  const groups = useMemo(() => getPopularityGroups(topicCountries), [topicCountries]);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const selected = groups.find((g) => g.id === groupId) ?? groups[0];

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScreenHeader title="Custom test" subtitle="Pick a tier, answer in your head, self-grade." />
      <ScrollView contentContainerClassName="px-5 pb-8 gap-5 pt-2">
        <View className="gap-2">
          <SectionLabel>Topic</SectionLabel>
          <View className="flex-row gap-3">
            {(["flag", "capital"] as Topic[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => {
                  setTopic(t);
                }}
                className={`flex-1 rounded-2xl border-2 p-4 ${topic === t ? "border-primary bg-primary/10" : "border-line bg-paper"}`}
              >
                <Text className={`text-[16px] font-black capitalize ${topic === t ? "text-primary" : "text-ink"}`}>
                  {t === "flag" ? "Flags" : "Capitals"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <SectionLabel>Country set</SectionLabel>
          <View className="gap-2">
            {groups.map((g) => {
              const on = g.id === groupId;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => setGroupId(g.id)}
                  className={`rounded-2xl border-2 px-4 py-3.5 ${on ? "border-primary bg-primary/10" : "border-line bg-paper"}`}
                >
                  <Text className={`text-[16px] font-black ${on ? "text-primary" : "text-ink"}`}>
                    {g.title} countries
                  </Text>
                  <Text className="text-[13px] font-semibold text-muted">{g.range}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <SectionLabel>Mode</SectionLabel>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setMode("recall")}
              className={`flex-1 rounded-2xl border-2 p-4 ${mode === "recall" ? "border-primary bg-primary/10" : "border-line bg-paper"}`}
            >
              <Text className={`text-[16px] font-black ${mode === "recall" ? "text-primary" : "text-ink"}`}>Recall only</Text>
              <Text className="text-[12px] font-semibold text-muted">No typing</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("options")}
              className={`flex-1 rounded-2xl border-2 p-4 ${mode === "options" ? "border-primary bg-primary/10" : "border-line bg-paper"}`}
            >
              <Text className={`text-[16px] font-black ${mode === "options" ? "text-primary" : "text-ink"}`}>With options</Text>
              <Text className="text-[12px] font-semibold text-muted">4 choices</Text>
            </Pressable>
          </View>
        </View>

        <PillButton
          label="Start test"
          variant="primary"
          icon="target"
          onPress={() =>
            selected && router.push({ pathname: "/test", params: { groupId: selected.id, mode, topic } })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}
