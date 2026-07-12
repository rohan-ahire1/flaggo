import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { dismiss } from "@/utils/nav";
import QuestionCard from "@/components/QuestionCard";
import RoundResults, { type RoundResultItem } from "@/components/RoundResults";
import Icon from "@/components/Icon";
import FlagImage from "@/components/FlagImage";
import { PillButton, Pill } from "@/components/ui";
import { buildArcadeQuestions, buildLessonQuestions } from "@/quiz/buildQuestions";
import { describeQuestion, questionLabel, type QuizOption } from "@/quiz/describeQuestion";
import { useProgress } from "@/state/ProgressProvider";
import { useAuth } from "@/auth/AuthProvider";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import type { AppProgress } from "@flaggo/core/types/progress";
import { arcadeKey, type ArcadeMode } from "@flaggo/core/types/arcade";
import type { Country } from "@flaggo/core/types/country";
import type { Topic } from "@flaggo/core/types/topic";
import { generateLessonQuestions, generateReviewQuestions, type Question } from "@flaggo/core/utils/quiz";
import { generateLessons } from "@flaggo/core/utils/lessonGenerator";
import { deckCountries } from "@flaggo/core/utils/decks";
import { countries } from "@flaggo/core/data/countries";
import { buildDailyQuiz, dateKey, applyDailyResult } from "@flaggo/core/utils/dailyChallenge";
import { earnedBadgeResults } from "@/lib/badges";
import { syncStreakReminder } from "@/lib/streakReminder";
import { persistArcadeBest } from "@flaggo/core/utils/arcade";
import { updateStreak } from "@flaggo/core/utils/date";
import { updateReviewState } from "@flaggo/core/utils/spacedRepetition";
import { awardBadges, evaluateBadges } from "@flaggo/core/game/badges";

type QuizItem = { question: Question; topic: Topic };

const XP_PER_CORRECT = 10;
const REVEAL_MS = 550;

function mmss(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function countryContext(country: Country) {
  const parts = [country.subregion ?? country.continent];
  if (country.capital) parts.push(`Capital: ${country.capital}`);
  return parts.join(" · ");
}

export default function QuizScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    topic?: string;
    amode?: string;
    lessonId?: string;
    deckId?: string;
    codes?: string;
  }>();
  const lessons = useMemo(() => generateLessons(countries), []);
  const lesson = useMemo(() => (params.lessonId ? lessons.find((l) => l.id === params.lessonId) ?? null : null), [lessons, params.lessonId]);
  const topic = (lesson?.topic as Topic) ?? (params.topic as Topic) ?? "flag";
  const isArcade = params.mode === "arcade";
  const isDaily = params.mode === "daily";
  const arcadeMode = (params.amode as ArcadeMode) ?? "timed";
  const isTimedArcade = isArcade && (arcadeMode === "timed" || arcadeMode === "hard");
  const arcadeLimit = arcadeMode === "hard" ? 45 : 60;

  const { progress, setProgress } = useProgress();
  const { user } = useAuth();
  const theme = useThemeStore((s) => s.theme);
  const draft = useRef<AppProgress>(progress);
  const finishing = useRef(false);
  const scoreRef = useRef(0);

  const items: QuizItem[] = useMemo(() => {
    const requestedCodes = typeof params.codes === "string" ? params.codes.split(",").map((code) => code.trim()).filter(Boolean) : [];
    if (requestedCodes.length) {
      const codeSet = new Set(requestedCodes);
      const pool = countries.filter((country) => codeSet.has(country.code)).slice(0, 12);
      return generateReviewQuestions(pool, topic).map((question) => ({ question, topic }));
    }
    if (isDaily) {
      return buildDailyQuiz(dateKey(), countries).map((d) => ({ question: d.question as Question, topic: d.topic as Topic }));
    }
    if (lesson) {
      return generateLessonQuestions(lesson, countries).map((question) => ({ question, topic }));
    }
    if (params.deckId) {
      const deck = progress.decks.find((d) => d.id === params.deckId && d.topic === topic);
      const pool = deck ? deckCountries(deck, countries) : [];
      if (pool.length >= 4) {
        return generateReviewQuestions(pool, topic).map((question) => ({ question, topic }));
      }
    }
    const qs = isArcade ? buildArcadeQuestions(topic, arcadeMode) : buildLessonQuestions(topic);
    return qs.map((question) => ({ question, topic }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDaily, isArcade, topic, arcadeMode, params.deckId, params.codes, lesson]);

  const [index, setIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<RoundResultItem[]>([]);
  const [finished, setFinished] = useState(false);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setNow(Date.now()), isTimedArcade ? 250 : 1000);
    return () => clearInterval(id);
  }, [finished, isTimedArcade]);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = isTimedArcade ? Math.max(0, arcadeLimit - Math.floor((now - startedAt) / 1000)) : null;

  useEffect(() => {
    if (!isTimedArcade || finished || remaining !== 0) return;
    if (revealed) {
      const id = setTimeout(() => void finish(), 250);
      return () => clearTimeout(id);
    }
    void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, isTimedArcade, remaining, revealed]);

  if (!items.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-paper p-6">
        <Text className="text-center text-lg font-bold text-ink">Not enough data for this topic yet.</Text>
        <View className="mt-5 w-48">
          <PillButton label="Go back" variant="primary" onPress={() => dismiss()} />
        </View>
      </SafeAreaView>
    );
  }

  const q = items[index].question;
  const qTopic = items[index].topic;
  const total = items.length;
  const described = describeQuestion(q);
  const correctOption = described.options.find((o) => o.correct);
  const chosenOption = described.options.find((o) => o.key === selectedKey);
  const wasCorrect = !!chosenOption?.correct;

  function select(option: QuizOption) {
    if (revealed) return;
    setSelectedKey(option.key);
    setRevealed(true);

    const correct = !!option.correct;
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    }
    let next = updateReviewState(q.correctCountry.code, qTopic, correct, draft.current);
    if (correct) {
      next = { ...next, xp: next.xp + XP_PER_CORRECT };
      scoreRef.current += 1;
      setScore((s) => s + 1);
    }
    draft.current = next;
    setResults((r) => [
      ...r,
      {
        label: questionLabel(q),
        correct,
        chosen: correct ? undefined : option.label ?? "—",
        answer: correct ? undefined : correctOption?.label,
        countryCode: q.correctCountry.code,
        countryName: q.correctCountry.name,
        context: countryContext(q.correctCountry)
      }
    ]);
  }

  function next() {
    if (!revealed) return;
    if (isArcade && arcadeMode === "sudden" && !wasCorrect) {
      finish();
      return;
    }
    if (index + 1 >= total) {
      finish();
    } else {
      setIndex((i) => i + 1);
      setSelectedKey(null);
      setRevealed(false);
    }
  }

  function optionPressIn() {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  }

  async function finish() {
    if (finishing.current) return;
    finishing.current = true;
    let done = draft.current;
    const scoreToSubmit = scoreRef.current;
    if (isDaily) {
      done = applyDailyResult(done, dateKey(), { score: scoreToSubmit, total });
    } else if (isArcade) {
      done = persistArcadeBest(done, arcadeMode, topic, scoreToSubmit);
    } else {
      done = updateStreak(done);
      if (lesson && !done.completedLessonIds.includes(lesson.id)) {
        done = { ...done, completedLessonIds: [...done.completedLessonIds, lesson.id] };
      }
    }
    const roundKind = isDaily ? "daily" : isArcade ? "arcade" : lesson ? "lesson" : "review";
    const newIds = evaluateBadges(done, countries, lessons, { kind: roundKind, arcadeMode: isArcade ? arcadeMode : undefined, score: scoreToSubmit, total });
    if (newIds.length) done = awardBadges(done, newIds);
    setEarnedBadgeIds(newIds);
    draft.current = done;
    setProgress(done);
    setFinished(true);
    if (isDaily) void syncStreakReminder(done).catch(() => undefined);
  }

  if (finished) {
    const finalScore = Math.max(score, scoreRef.current);
    const streak = isDaily ? draft.current.daily.streak : isArcade ? undefined : draft.current.streak;
    const missed = results.filter((item) => !item.correct).length;
    const actions = isDaily
      ? [
          { label: "Done", variant: "primary" as const, icon: "today" as const, onPress: () => dismiss() }
        ]
      : [
          ...(missed
            ? [
                {
                  label: "Review mistakes",
                  variant: "primary" as const,
                  icon: "review" as const,
                  onPress: () => router.replace("/review")
                }
              ]
            : []),
          {
            label: "Play again",
            variant: missed ? "secondary" as const : "primary" as const,
            icon: "swap" as const,
            onPress: () =>
              router.replace({
                pathname: "/quiz",
                params: { mode: params.mode ?? "lesson", topic, amode: arcadeMode }
              })
          },
          { label: "Done", variant: "secondary" as const, onPress: () => dismiss() }
        ];
    return (
      <RoundResults
        score={finalScore}
        total={total}
        items={results}
        streak={streak}
        caption={`${mmss(elapsed)} · +${finalScore * XP_PER_CORRECT} XP`}
        earnedBadges={earnedBadgeResults(earnedBadgeIds)}
        actions={actions}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      {/* Header: close + progress bar */}
      <View className="w-full max-w-[900px] self-center flex-row items-center gap-3 px-5 pb-3 pt-1 lg:px-8">
        <Pressable onPress={() => dismiss()} hitSlop={10}>
          <Icon name="x" size={24} color={themeColor(theme, "muted")} />
        </Pressable>
        <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.round(((index + (revealed ? 1 : 0)) / total) * 100)}%` }}
          />
        </View>
      </View>

      <View className="w-full max-w-[900px] self-center flex-row items-center justify-between px-5 pb-2 lg:px-8">
        <Text className="text-[15px] font-bold text-muted">
          Question {index + 1}{isArcade ? "" : ` of ${total}`}
        </Text>
        <View className="flex-row gap-2">
          <Pill icon="clock" label={mmss(remaining ?? elapsed)} tone="muted" />
          <Pill icon="star" label={String(score)} tone="accent" />
        </View>
      </View>
      {isArcade ? (
        <View className="w-full max-w-[900px] self-center px-5 pb-2 lg:px-8">
          <Text className="text-[13px] font-bold text-muted">
            {arcadeMode === "timed" ? "60s on the clock" : arcadeMode === "hard" ? "45s · lookalike flags" : "One wrong answer ends the run"}
          </Text>
        </View>
      ) : null}

      <ScrollView contentContainerClassName="w-full max-w-[900px] self-center px-5 pb-3 lg:px-8">
        <QuestionCard question={q} revealed={revealed} selectedKey={selectedKey} onSelect={select} onOptionPressIn={optionPressIn} />
      </ScrollView>

      {/* Footer: feedback + next */}
      <View className="border-t border-line bg-paper">
        <View className="w-full max-w-[900px] self-center gap-3 px-5 pb-4 pt-3 lg:px-8">
          {notice ? <Text className="text-center text-[13px] font-bold text-error">{notice}</Text> : null}
          {revealed ? (
            <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5">
              <View className="w-14">
                <FlagImage code={q.correctCountry.code} width={120} className="rounded-lg" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[15px] font-black text-ink" numberOfLines={1}>
                  {q.correctCountry.name}
                </Text>
                <Text className="text-[12px] font-semibold text-muted" numberOfLines={2}>
                  {countryContext(q.correctCountry)}
                </Text>
              </View>
            </View>
          ) : null}
          <Text
            className={`text-center text-[15px] font-bold ${revealed ? (wasCorrect ? "text-success" : "text-error") : "text-muted"}`}
          >
            {revealed
              ? wasCorrect
                ? "Correct!"
                : `Answer: ${correctOption?.label ?? q.correctCountry.name}`
              : "Tap the answer you think is right"}
          </Text>
          <PillButton
            label={index + 1 >= total || (isArcade && arcadeMode === "sudden" && revealed && !wasCorrect) ? "See results" : "Next question"}
            variant="primary"
            iconRight="arrow-right"
            onPress={next}
            className={revealed ? "" : "opacity-40"}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
