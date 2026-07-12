import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import FlagImage from "@/components/FlagImage";
import ScreenHeader from "@/components/ScreenHeader";
import { Badge, Card, PillButton, Pill, SectionLabel } from "@/components/ui";
import { countries } from "@flaggo/core/data/countries";
import { useProgress } from "@/state/ProgressProvider";
import { useAuth } from "@/auth/AuthProvider";
import { arcadeScore } from "@flaggo/core/utils/arcade";
import { triviaBoard } from "@flaggo/core/game/boards";
import { awardBadges, evaluateBadges } from "@flaggo/core/game/badges";
import { hashStringToSeed, mulberry32 } from "@flaggo/core/utils/seededRandom";
import { buildTrivia, type TriviaMode, type TriviaRound } from "@flaggo/core/utils/trivia";
import { generateLessons } from "@flaggo/core/utils/lessonGenerator";
import { earnedBadgeResults } from "@/lib/badges";
import Icon from "@/components/Icon";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

const MODES: { mode: TriviaMode; label: string }[] = [
  { mode: "higher-lower", label: "Higher/Lower" },
  { mode: "odd-one-out", label: "Odd one out" },
  { mode: "true-false", label: "True/False" }
];
type RunMode = "timed" | "sudden";
const triviaKey = triviaBoard;

function formatMetric(value: number, metric: "population" | "area") {
  return metric === "area" ? `${value.toLocaleString()} km²` : value.toLocaleString();
}
function answerLabel(round: TriviaRound) {
  if (round.mode === "true-false") return round.answer ? "True" : "False";
  return round.correctCountry.name;
}

export default function TriviaScreen() {
  const { progress, setProgress } = useProgress();
  const { user } = useAuth();
  const theme = useThemeStore((s) => s.theme);
  const lessons = useMemo(() => generateLessons(countries), []);
  const [mode, setMode] = useState<TriviaMode>("higher-lower");
  const [runMode, setRunMode] = useState<RunMode>("timed");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [seed, setSeed] = useState("idle");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; round: TriviaRound } | null>(null);
  const [remaining, setRemaining] = useState(60);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);

  const rounds = useMemo(() => {
    const rng = mulberry32(hashStringToSeed(seed));
    return Array.from({ length: 60 }, () => buildTrivia(mode, countries, rng));
  }, [mode, seed]);
  const round = rounds[index % Math.max(rounds.length, 1)];
  const score = arcadeScore(runMode === "sudden" ? "sudden" : "timed", answers);
  const best = progress.arcade[triviaKey(mode)] ?? 0;

  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => setRemaining((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [running, done]);
  useEffect(() => {
    if (running && remaining === 0) finish();
  }, [remaining, running]);

  function start() {
    setSeed(`trivia-${mode}-${runMode}-${Date.now()}`);
    setRunning(true);
    setDone(false);
    setIndex(0);
    setAnswers([]);
    setFeedback(null);
    setRemaining(60);
    setEarnedBadgeIds([]);
  }
  function answer(ok: boolean) {
    if (!round || feedback || done) return;
    const nextAnswers = [...answers, ok];
    setAnswers(nextAnswers);
    setFeedback({ ok, round });
    if (runMode === "sudden" && !ok) setTimeout(() => finish(nextAnswers), 300);
  }
  function finish(finalAnswers = answers) {
    if (done) return;
    const finalScore = arcadeScore(runMode === "sudden" ? "sudden" : "timed", finalAnswers);
    const key = triviaKey(mode);
    let next = {
      ...progress,
      arcade: { ...progress.arcade, [key]: Math.max(progress.arcade[key] ?? 0, finalScore) }
    };
    const newIds = evaluateBadges(next, countries, lessons, { kind: "trivia", score: finalScore, total: finalAnswers.length });
    if (newIds.length) next = awardBadges(next, newIds);
    setEarnedBadgeIds(newIds);
    setProgress(next);
    setDone(true);
    setRunning(false);
  }
  function continueNext() {
    if (!feedback) return;
    setFeedback(null);
    if (index >= rounds.length - 1 || remaining <= 0) finish();
    else setIndex((v) => v + 1);
  }

  // --- Setup / done ---
  if (!running) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
        <ScreenHeader title="Trivia" subtitle="Higher/lower, odd-one-out, true/false." />
        <ScrollView contentContainerClassName="w-full max-w-[960px] self-center px-5 pb-8 gap-5 pt-2 lg:px-8">
          {done ? (
            <Card className="items-center gap-1 py-6">
              <Text className="text-[44px] font-black text-success">{score}</Text>
              <Text className="font-bold text-muted">Best {Math.max(best, score)}</Text>
            </Card>
          ) : null}
          {done && earnedBadgeIds.length ? (
            <Card className="flex-row items-center gap-3 border-primary/30 bg-primary/10">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
                <Icon name="trophy" size={21} color="white" />
              </View>
              <View className="flex-1">
                <SectionLabel>Badge earned!</SectionLabel>
                <Text className="text-[17px] font-extrabold text-ink">
                  {earnedBadgeResults(earnedBadgeIds).map((badge) => badge.name).join(", ")}
                </Text>
              </View>
              <Icon name={earnedBadgeResults(earnedBadgeIds)[0]?.icon ?? "trophy"} size={22} color={themeColor(theme, "primary")} />
            </Card>
          ) : null}
          <View className="gap-2">
            <SectionLabel>Run</SectionLabel>
            <Segmented options={["timed", "sudden"]} value={runMode} onChange={(v) => setRunMode(v as RunMode)} />
          </View>
          <View className="gap-2">
            <SectionLabel>Mode</SectionLabel>
            <View className="gap-2">
              {MODES.map((m) => {
                const on = m.mode === mode;
                return (
                  <Pressable
                    key={m.mode}
                    onPress={() => setMode(m.mode)}
                    className={`rounded-2xl border-2 px-4 py-3.5 ${on ? "border-primary bg-primary/10" : "border-line bg-paper"}`}
                  >
                    <Text className={`text-[16px] font-black ${on ? "text-primary" : "text-ink"}`}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <PillButton label="Start trivia" variant="primary" icon="sparkle" onPress={start} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Running ---
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <View className="w-full max-w-[960px] self-center flex-row items-center gap-3 px-5 pb-2 pt-1 lg:px-8">
        <Pressable onPress={() => finish()} hitSlop={10}>
          <Text className="text-[15px] font-bold text-muted">End</Text>
        </Pressable>
        <View className="flex-1 flex-row justify-end gap-2">
          <Pill icon="star" label={String(score)} tone="accent" />
          <Pill icon="clock" label={`${remaining}s`} tone="error" />
        </View>
      </View>

      <ScrollView contentContainerClassName="w-full max-w-[960px] self-center px-5 pb-3 lg:px-8">
        <Animated.View key={round.id} entering={FadeIn.duration(200)} className="gap-4">
          <TriviaBody round={round} revealed={!!feedback} onAnswer={answer} />
        </Animated.View>
      </ScrollView>

      <View className="border-t border-line bg-paper">
        <View className="w-full max-w-[960px] self-center gap-3 px-5 pb-4 pt-3 lg:px-8">
          <Text
            className={`text-center text-[15px] font-bold ${feedback ? (feedback.ok ? "text-success" : "text-error") : "text-muted"}`}
          >
            {feedback ? `${feedback.ok ? "Correct!" : "Not quite."} Answer: ${answerLabel(feedback.round)}` : "Pick your answer"}
          </Text>
          <PillButton
            label="Continue"
            variant="primary"
            iconRight="arrow-right"
            onPress={continueNext}
            className={feedback ? "" : "opacity-40"}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function TriviaBody({
  round,
  revealed,
  onAnswer
}: {
  round: TriviaRound;
  revealed: boolean;
  onAnswer: (ok: boolean) => void;
}) {
  if (round.mode === "higher-lower") {
    return (
      <View className="gap-3">
        <Text className="text-[20px] font-black text-ink">Which country has the larger {round.metric}?</Text>
        <View className="flex-row gap-3">
          {round.countries.map((c) => (
            <Pressable
              key={c.code}
              disabled={revealed}
              onPress={() => onAnswer(c.code === round.correctCountry.code)}
              className="flex-1 rounded-2xl border-2 border-line bg-paper p-2"
            >
              <FlagImage code={c.code} width={320} className="border-0" />
              <Text className="mt-2 text-[16px] font-black text-ink" numberOfLines={1}>
                {c.name}
              </Text>
              {revealed ? (
                <Text className="text-[12px] font-bold text-muted">{formatMetric(c[round.metric] ?? 0, round.metric)}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  if (round.mode === "odd-one-out") {
    return (
      <View className="gap-3">
        <Text className="text-[20px] font-black text-ink">Which country does not fit the set?</Text>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {round.countries.map((c) => (
            <Pressable
              key={c.code}
              disabled={revealed}
              onPress={() => onAnswer(c.code === round.correctCountry.code)}
              className="w-[48%] rounded-2xl border-2 border-line bg-paper p-2"
            >
              <FlagImage code={c.code} width={320} className="border-0" />
              <Text className="mt-2 text-[15px] font-black text-ink" numberOfLines={1}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View className="gap-4">
      <Card className="items-center py-6">
        <Text className="text-center text-[22px] font-black text-ink">{round.statement}</Text>
      </Card>
      <Text className="text-[18px] font-black text-ink">Is this statement correct?</Text>
      <View className="flex-row gap-3">
        <Pressable
          disabled={revealed}
          onPress={() => onAnswer(round.answer)}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-line bg-paper py-4"
        >
          <Badge letter="T" />
          <Text className="text-[18px] font-black text-ink">True</Text>
        </Pressable>
        <Pressable
          disabled={revealed}
          onPress={() => onAnswer(!round.answer)}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-line bg-paper py-4"
        >
          <Badge letter="F" />
          <Text className="text-[18px] font-black text-ink">False</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Segmented({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="flex-row rounded-2xl bg-surface p-1">
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          className={`flex-1 items-center rounded-xl py-2.5 ${value === o ? "bg-primary" : ""}`}
        >
          <Text className={`text-[14px] font-extrabold capitalize ${value === o ? "text-white" : "text-muted"}`}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}
