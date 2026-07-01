import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import FlagImage from "@/components/FlagImage";
import WorldMap from "@/components/WorldMap";
import RoundResults, { type RoundResultItem } from "@/components/RoundResults";
import { Badge, PillButton, Pill } from "@/components/ui";
import { countries } from "@/data/countries";
import { useProgress } from "@/state/ProgressProvider";
import { generateMapQuestions, type MapMode } from "@/utils/quiz";
import { updateReviewState } from "@/utils/spacedRepetition";

export default function MapPlayScreen() {
  const params = useLocalSearchParams<{ mode?: string; codes?: string }>();
  const mode = (params.mode as MapMode) ?? "locate";
  const { progress, setProgress } = useProgress();

  const pool = useMemo(() => {
    const codes = new Set((params.codes ?? "").split(",").filter(Boolean));
    const list = codes.size ? countries.filter((c) => codes.has(c.code)) : countries;
    return list.length >= 4 ? list : countries;
  }, [params.codes]);
  const byCode = useMemo(() => new Map(countries.map((c) => [c.code, c])), []);
  const questions = useMemo(() => generateMapQuestions(pool, mode), [pool, mode]);

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<RoundResultItem[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; wrongCode?: string } | null>(null);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const target = question ? byCode.get(question.targetCode) : undefined;

  if (!question || !target || finished) {
    return (
      <RoundResults
        score={score}
        total={questions.length}
        items={results}
        caption={mode === "locate" ? "Locate" : "Identify"}
        actions={[{ label: "Done", variant: "primary", icon: "check", onPress: () => router.back() }]}
      />
    );
  }

  function answer(code: string) {
    if (feedback || !target) return;
    const ok = code === target.code;
    const next = updateReviewState(target.code, "location", ok, progress);
    setProgress({ ...next, xp: next.xp + (ok ? 10 : 0) });
    if (ok) setScore((s) => s + 1);
    setResults((r) => [
      ...r,
      { label: `Locate ${target.name}`, correct: ok, chosen: ok ? undefined : byCode.get(code)?.name }
    ]);
    setFeedback({ ok, wrongCode: ok ? undefined : code });
  }

  function next() {
    setFeedback(null);
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex((i) => i + 1);
  }

  const isIdentify = question.type === "identify-country";

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-3 px-5 pb-2 pt-1">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text className="text-[15px] font-bold text-muted">Exit</Text>
        </Pressable>
        <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <View className="h-full rounded-full bg-primary" style={{ width: `${(index / questions.length) * 100}%` }} />
        </View>
        <Pill icon="check" label={String(score)} tone="success" />
      </View>

      <ScrollView contentContainerClassName="px-5 pb-3 gap-4">
        <View className="rounded-2xl border border-line bg-surface p-4">
          <Text className="text-[12px] font-extrabold uppercase tracking-wide text-primary">
            {mode === "locate" ? "Locate" : "Identify"}
          </Text>
          {mode === "locate" ? (
            <View className="mt-2 flex-row items-center gap-3">
              <View className="w-16">
                <FlagImage code={target.code} width={160} />
              </View>
              <Text className="flex-1 text-[22px] font-black text-ink">Tap {target.name}</Text>
            </View>
          ) : (
            <Text className="mt-1 text-[22px] font-black text-ink">Which country is highlighted?</Text>
          )}
        </View>

        <WorldMap
          countries={countries}
          highlightCode={isIdentify ? question.targetCode : undefined}
          correctCode={feedback ? target.code : undefined}
          wrongCode={feedback?.wrongCode}
          interactive={!feedback && mode === "locate"}
          onCountryTap={answer}
          height={340}
        />

        {isIdentify ? (
          <View className="gap-2.5">
            {question.options.map((c, i) => {
              const st = !feedback
                ? "idle"
                : c.code === target.code
                  ? "correct"
                  : c.code === feedback.wrongCode
                    ? "wrong"
                    : "idle";
              const cls =
                st === "correct"
                  ? "border-success bg-success/15"
                  : st === "wrong"
                    ? "border-error bg-error/15"
                    : feedback
                      ? "border-line bg-paper opacity-45"
                      : "border-line bg-paper";
              return (
                <Pressable
                  key={c.code}
                  disabled={!!feedback}
                  onPress={() => answer(c.code)}
                  className={`flex-row items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 ${cls}`}
                >
                  <Badge letter={["A", "B", "C", "D"][i]} state={st} />
                  <Text className="flex-1 text-[18px] font-bold text-ink">{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <View className="gap-2 border-t border-line px-5 pb-1 pt-3">
        <Text
          className={`text-center text-[15px] font-bold ${feedback ? (feedback.ok ? "text-success" : "text-error") : "text-muted"}`}
        >
          {feedback ? (feedback.ok ? "Correct!" : `Answer: ${target.name}`) : mode === "locate" ? "Tap the country on the map" : "Pick the country"}
        </Text>
        <PillButton
          label={index + 1 >= questions.length ? "See results" : "Next"}
          variant="primary"
          iconRight="arrow-right"
          onPress={() => feedback && next()}
          className={feedback ? "" : "opacity-40"}
        />
      </View>
    </SafeAreaView>
  );
}
