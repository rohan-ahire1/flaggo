import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { dismiss } from "@/utils/nav";
import Animated, { FadeIn } from "react-native-reanimated";
import FlagImage from "@/components/FlagImage";
import RoundResults, { type RoundResultItem } from "@/components/RoundResults";
import { Badge, MapPanel, PillButton, Pill } from "@/components/ui";
import { countries } from "@/data/countries";
import { useProgress } from "@/state/ProgressProvider";
import { getPopularityGroups } from "@/utils/popularity";
import { getCapitalDistractors, getDistractors, shuffleArray } from "@/utils/quiz";
import { updateReviewState } from "@/utils/spacedRepetition";
import type { AppProgress } from "@/types/progress";
import type { Topic } from "@/types/topic";

const LETTERS = ["A", "B", "C", "D"];

export default function TestScreen() {
  const params = useLocalSearchParams<{ groupId: string; mode: string; topic: string }>();
  const topic = (params.topic as Topic) ?? "flag";
  const isRecall = params.mode !== "options";
  const { progress, setProgress } = useProgress();

  const questions = useMemo(() => {
    const pool = topic === "capital" ? countries.filter((c) => c.capital?.trim()) : countries;
    const group = getPopularityGroups(pool).find((g) => g.id === params.groupId);
    return shuffleArray(group?.countries ?? pool.slice(0, 20));
  }, [params.groupId, topic]);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<RoundResultItem[]>([]);
  const [finished, setFinished] = useState(false);

  const country = questions[index];
  const answer = topic === "capital" ? country?.capital?.trim() ?? "" : country?.name ?? "";
  const options = useMemo(() => {
    if (!country || isRecall) return [];
    if (topic === "capital") {
      return shuffleArray([country.capital!.trim(), ...getCapitalDistractors(country, countries, 3)]);
    }
    return shuffleArray([country.name, ...getDistractors(country, countries, 3).map((c) => c.name)]);
  }, [country, isRecall, topic]);

  if (!country || finished) {
    return (
      <RoundResults
        score={score}
        total={questions.length}
        items={results}
        caption={`${topic === "capital" ? "Capitals" : "Flags"} test`}
        actions={[
          { label: "Done", variant: "primary", icon: "check", onPress: () => dismiss() }
        ]}
      />
    );
  }

  function grade(ok: boolean, chosenLabel?: string) {
    if (ok) setScore((s) => s + 1);
    const next: AppProgress = updateReviewState(country.code, topic, ok, progress);
    setProgress({ ...next, xp: next.xp + (ok ? 5 : 0) });
    setResults((r) => [
      ...r,
      { label: topic === "capital" ? `Capital of ${country.name}` : `Flag of ${country.name}`, correct: ok, chosen: ok ? undefined : chosenLabel, answer: ok ? undefined : answer }
    ]);
  }

  function pickOption(label: string) {
    if (revealed) return;
    setPicked(label);
    setRevealed(true);
    grade(label === answer, label);
  }

  function gradeRecall(ok: boolean) {
    grade(ok);
    advance();
  }

  function advance() {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
      setPicked(null);
    }
  }

  function optionState(label: string): "idle" | "correct" | "wrong" {
    if (!revealed) return "idle";
    if (label === answer) return "correct";
    if (label === picked) return "wrong";
    return "idle";
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <View className="w-full max-w-[900px] self-center flex-row items-center gap-3 px-5 pb-2 pt-1 lg:px-8">
        <Pressable onPress={() => dismiss()} hitSlop={10}>
          <Text className="text-[15px] font-bold text-muted">Exit</Text>
        </Pressable>
        <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <View className="h-full rounded-full bg-primary" style={{ width: `${((index + (revealed ? 1 : 0)) / questions.length) * 100}%` }} />
        </View>
        <Pill icon="check" label={String(score)} tone="success" />
      </View>

      <ScrollView contentContainerClassName="w-full max-w-[900px] self-center px-5 pb-3 lg:px-8">
        <Animated.View key={country.code} entering={FadeIn.duration(200)}>
          <View className="gap-4">
          <Text className="text-[15px] font-bold text-muted">
            {topic === "capital" ? "Capital" : "Flag"} {index + 1} of {questions.length}
          </Text>
          <MapPanel height={190}>
            <FlagImage code={country.code} width={640} className="w-44 border-0" />
          </MapPanel>

          {isRecall ? (
            <View className="items-center gap-1 rounded-2xl bg-surface p-4">
              <Text className="text-[17px] font-black text-ink">
                Say the {topic === "capital" ? "capital" : "country"} in your head.
              </Text>
              {revealed ? <Text className="mt-1 text-[22px] font-black text-primary">{answer}</Text> : null}
            </View>
          ) : (
            <View className="gap-2.5 md:flex-row md:flex-wrap md:justify-between md:gap-y-3">
              {options.map((o, i) => {
                const st = optionState(o);
                const cls =
                  st === "correct"
                    ? "border-success bg-success/15"
                    : st === "wrong"
                      ? "border-error bg-error/15"
                      : revealed
                        ? "border-line bg-paper opacity-45"
                        : "border-line bg-paper";
                return (
                  <Pressable
                    key={o}
                    disabled={revealed}
                    onPress={() => pickOption(o)}
                    className={`flex-row items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 md:w-[48.5%] ${cls}`}
                  >
                    <Badge letter={LETTERS[i]} state={st} />
                    <Text className="flex-1 text-[18px] font-bold text-ink">{o}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          </View>
        </Animated.View>
      </ScrollView>

      <View className="border-t border-line bg-paper">
        <View className="w-full max-w-[900px] self-center gap-3 px-5 pb-4 pt-3 lg:px-8">
          {isRecall ? (
            revealed ? (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <PillButton label="Missed it" variant="secondary" icon="x" onPress={() => gradeRecall(false)} />
                </View>
                <View className="flex-1">
                  <PillButton label="Got it" variant="primary" icon="check" onPress={() => gradeRecall(true)} />
                </View>
              </View>
            ) : (
              <PillButton label="Reveal answer" variant="primary" onPress={() => setRevealed(true)} />
            )
          ) : (
            <PillButton
              label={index + 1 >= questions.length ? "See results" : "Next"}
              variant="primary"
              iconRight="arrow-right"
              onPress={() => revealed && advance()}
              className={revealed ? "" : "opacity-40"}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
