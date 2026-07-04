import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { promptChallenge } from "@/social/challenge";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import type { AppProgress } from "@/types/progress";
import type { ArcadeMode } from "@/types/arcade";
import type { Country } from "@/types/country";
import type { Topic } from "@/types/topic";
import { generateLessonQuestions, generateReviewQuestions, type Question } from "@/utils/quiz";
import { generateLessons } from "@/utils/lessonGenerator";
import { deckCountries } from "@/utils/decks";
import { countries } from "@/data/countries";
import { buildDailyQuiz, dateKey, applyDailyResult } from "@/utils/dailyChallenge";
import { buildMatchQuestions, normalizeMatchConfig, submitMatchResult, type MatchConfig } from "@/lib/matches";
import { persistArcadeBest } from "@/utils/arcade";
import { updateReviewState } from "@/utils/spacedRepetition";

const DAILY_COUNT = 5;
type QuizItem = { question: Question; topic: Topic };

const XP_PER_CORRECT = 10;
const REVEAL_MS = 550;

function mmss(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function bumpStreak(progress: AppProgress): AppProgress {
  const today = new Date().toISOString().slice(0, 10);
  if (progress.lastLessonDate === today) return progress;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = progress.lastLessonDate === yesterday ? (progress.streak ?? 0) + 1 : 1;
  return { ...progress, streak, lastLessonDate: today };
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
    matchId?: string;
    seed?: string;
    config?: string;
    lessonId?: string;
    deckId?: string;
  }>();
  const lesson = useMemo(
    () => (params.lessonId ? generateLessons(countries).find((l) => l.id === params.lessonId) ?? null : null),
    [params.lessonId]
  );
  const topic = (lesson?.topic as Topic) ?? (params.topic as Topic) ?? "flag";
  const isArcade = params.mode === "arcade";
  const isDaily = params.mode === "daily";
  const isMatch = params.mode === "match";
  const arcadeMode = (params.amode as ArcadeMode) ?? "timed";

  const { progress, setProgress } = useProgress();
  const { displayName } = useAuth();
  const theme = useThemeStore((s) => s.theme);
  const draft = useRef<AppProgress>(progress);

  const items: QuizItem[] = useMemo(() => {
    if (isMatch && params.seed && params.config) {
      const config = normalizeMatchConfig(JSON.parse(params.config) as MatchConfig);
      return buildMatchQuestions(params.seed, config, countries).map((m) => ({
        question: m.question as Question,
        topic: m.topic as Topic
      }));
    }
    if (isDaily) {
      return buildDailyQuiz(dateKey(), countries, false)
        .slice(0, DAILY_COUNT)
        .map((d) => ({ question: d.question as Question, topic: d.topic as Topic }));
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
  }, [isMatch, isDaily, isArcade, topic, arcadeMode, params.seed, params.config, params.deckId, lesson]);

  const [index, setIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<RoundResultItem[]>([]);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [finished]);

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
    let next = updateReviewState(q.correctCountry.code, qTopic, correct, draft.current);
    if (correct) {
      next = { ...next, xp: next.xp + XP_PER_CORRECT };
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
    if (index + 1 >= total) {
      finish();
    } else {
      setIndex((i) => i + 1);
      setSelectedKey(null);
      setRevealed(false);
    }
  }

  function finish() {
    let done = draft.current;
    if (isMatch) {
      draft.current = done;
      setProgress(done);
      // Submit the result (best-effort — needs sign-in) then show the compare screen.
      if (params.matchId) {
        void submitMatchResult(params.matchId, score, total, displayName ?? "Player").catch(() => undefined);
        router.replace({ pathname: "/match/[id]", params: { id: params.matchId, my: String(score) } });
      }
      return;
    }
    if (isDaily) {
      done = applyDailyResult(done, dateKey(), { score, total });
    } else if (isArcade) {
      done = persistArcadeBest(done, arcadeMode, topic, score);
    } else {
      done = bumpStreak(done);
      if (lesson && !done.completedLessonIds.includes(lesson.id)) {
        done = { ...done, completedLessonIds: [...done.completedLessonIds, lesson.id] };
      }
    }
    draft.current = done;
    setProgress(done);
    setFinished(true);
  }

  if (finished) {
    const streak = isDaily ? draft.current.daily.streak : isArcade ? undefined : draft.current.streak;
    const missed = results.filter((item) => !item.correct).length;
    const actions = isDaily
      ? [
          {
            label: "Challenge a friend",
            variant: "primary" as const,
            icon: "users" as const,
            onPress: () => void promptChallenge(score)
          },
          {
            label: "See leaderboard",
            variant: "secondary" as const,
            icon: "trophy" as const,
            onPress: () => router.replace("/leaderboard")
          },
          { label: "Done", variant: "secondary" as const, onPress: () => dismiss() }
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
        score={score}
        total={total}
        items={results}
        streak={streak}
        caption={`${mmss(elapsed)} · +${score * XP_PER_CORRECT} XP`}
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
          Question {index + 1} of {total}
        </Text>
        <View className="flex-row gap-2">
          <Pill icon="clock" label={mmss(elapsed)} tone="muted" />
          <Pill icon="star" label={String(score)} tone="accent" />
        </View>
      </View>

      <ScrollView contentContainerClassName="w-full max-w-[900px] self-center px-5 pb-3 lg:px-8">
        <QuestionCard question={q} revealed={revealed} selectedKey={selectedKey} onSelect={select} />
      </ScrollView>

      {/* Footer: feedback + next */}
      <View className="border-t border-line bg-paper">
        <View className="w-full max-w-[900px] self-center gap-3 px-5 pb-4 pt-3 lg:px-8">
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
            label={index + 1 >= total ? "See results" : "Next question"}
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
