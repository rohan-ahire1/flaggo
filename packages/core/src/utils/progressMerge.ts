import { defaultProgress, type AppProgress, type DailyProgress, type DailyResult, type Deck, type ReviewState } from "../types/progress";
import { parseReviewKey, reviewKey, TOPICS, type Topic } from "../types/topic";

function laterDate(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

function nonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function validTopic(value: unknown): value is Topic {
  return typeof value === "string" && TOPICS.includes(value as Topic);
}

function chooseReview(a: ReviewState | undefined, b: ReviewState | undefined): ReviewState | undefined {
  if (!a) return b;
  if (!b) return a;
  const winner =
    a.box > b.box ? a : b.box > a.box ? b : new Date(a.lastSeenAt ?? 0).getTime() >= new Date(b.lastSeenAt ?? 0).getTime() ? a : b;
  return {
    ...winner,
    correctCount: (a.correctCount ?? 0) + (b.correctCount ?? 0),
    wrongCount: (a.wrongCount ?? 0) + (b.wrongCount ?? 0)
  };
}

export function normalizeProgress(progress: Partial<AppProgress> | null | undefined): AppProgress {
  const review: AppProgress["review"] = {};
  Object.entries(progress?.review ?? {}).forEach(([key, value]) => {
    if (!value || typeof value !== "object") return;
    const parsed = parseReviewKey(key);
    if (!validTopic(parsed.topic)) return;
    const state = value as Partial<ReviewState>;
    const nextKey = reviewKey(parsed.code, parsed.topic);
    const normalizedState = {
      box: Math.max(1, nonNegativeInteger(state.box || 1)),
      correctCount: nonNegativeInteger(state.correctCount),
      wrongCount: nonNegativeInteger(state.wrongCount),
      lastSeenAt: typeof state.lastSeenAt === "string" ? state.lastSeenAt : null,
      nextReviewAt: typeof state.nextReviewAt === "string" ? state.nextReviewAt : new Date(0).toISOString(),
      countryCode: parsed.code,
      topic: parsed.topic
    };
    review[nextKey] = chooseReview(review[nextKey], normalizedState) ?? normalizedState;
  });
  const selectedTopic = validTopic(progress?.selectedTopic) ? progress.selectedTopic : "flag";
  const daily = normalizeDaily(progress?.daily);
  const arcade = normalizeArcade(progress?.arcade);
  const decks = normalizeDecks(progress?.decks);
  return {
    ...defaultProgress,
    ...(progress ?? {}),
    xp: nonNegativeInteger(progress?.xp),
    coins: nonNegativeInteger(progress?.coins),
    streak: nonNegativeInteger(progress?.streak),
    lastLessonDate: typeof progress?.lastLessonDate === "string" ? progress.lastLessonDate : null,
    completedLessonIds: Array.isArray(progress?.completedLessonIds) ? progress.completedLessonIds.filter((id): id is string => typeof id === "string") : [],
    selectedTopic,
    review,
    totalCorrect: nonNegativeInteger(progress?.totalCorrect),
    totalWrong: nonNegativeInteger(progress?.totalWrong),
    daily,
    arcade,
    decks
  };
}

function isDailyResult(value: unknown): value is DailyResult {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DailyResult>;
  return typeof item.score === "number" && Number.isFinite(item.score) && typeof item.total === "number" && Number.isFinite(item.total);
}

function normalizeDaily(value: unknown): DailyProgress {
  if (!value || typeof value !== "object") return defaultProgress.daily;
  const daily = value as Partial<DailyProgress>;
  const history: Record<string, DailyResult> = {};
  Object.entries(daily.history ?? {}).forEach(([date, result]) => {
    if (isDailyResult(result)) {
      history[date] = {
        score: nonNegativeInteger(result.score),
        total: nonNegativeInteger(result.total)
      };
    }
  });
  return {
    lastDate: typeof daily.lastDate === "string" ? daily.lastDate : null,
    streak: nonNegativeInteger(daily.streak),
    best: nonNegativeInteger(daily.best),
    history
  };
}

function normalizeArcade(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, score]) => typeof score === "number" && Number.isFinite(score))
      .map(([key, score]) => [key, nonNegativeInteger(score)])
  );
}

function normalizeDecks(value: unknown): Deck[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const decks: Deck[] = [];
  value.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const deck = item as Partial<Deck>;
    if (typeof deck.id !== "string" || typeof deck.name !== "string" || !Array.isArray(deck.codes) || !validTopic(deck.topic)) return;
    if (seen.has(deck.id)) return;
    seen.add(deck.id);
    decks.push({
      id: deck.id,
      name: deck.name,
      codes: deck.codes.filter((code): code is string => typeof code === "string"),
      topic: deck.topic,
      createdAt: typeof deck.createdAt === "string" ? deck.createdAt : new Date(0).toISOString()
    });
  });
  return decks;
}

function mergeDaily(local: DailyProgress, server: DailyProgress): DailyProgress {
  const history: Record<string, DailyResult> = { ...local.history };
  Object.entries(server.history).forEach(([date, result]) => {
    const current = history[date];
    if (!current || result.score > current.score || (result.score === current.score && result.total > current.total)) history[date] = result;
  });
  return {
    lastDate: laterDate(local.lastDate, server.lastDate),
    streak: Math.max(local.streak, server.streak),
    best: Math.max(local.best, server.best),
    history
  };
}

function mergeDecks(local: Deck[], server: Deck[]): Deck[] {
  const decks = new Map<string, Deck>();
  [...local, ...server].forEach((deck) => {
    const current = decks.get(deck.id);
    if (!current) {
      decks.set(deck.id, deck);
      return;
    }
    const codes = Array.from(new Set([...current.codes, ...deck.codes]));
    const newer = deck.createdAt > current.createdAt ? deck : current;
    const chosen = deck.createdAt === current.createdAt && codes.length > newer.codes.length ? { ...newer, codes } : { ...newer, codes };
    decks.set(deck.id, chosen);
  });
  return Array.from(decks.values());
}

export function mergeProgress(local: AppProgress, server: AppProgress): AppProgress {
  local = normalizeProgress(local);
  server = normalizeProgress(server);
  const review: AppProgress["review"] = {};
  const keys = new Set([...Object.keys(local.review), ...Object.keys(server.review)]);
  keys.forEach((key) => {
    const merged = chooseReview(local.review[key], server.review[key]);
    if (merged) review[key] = merged;
  });

  return {
    ...defaultProgress,
    xp: Math.max(local.xp, server.xp),
    coins: Math.max(local.coins, server.coins),
    streak: Math.max(local.streak, server.streak),
    lastLessonDate: laterDate(local.lastLessonDate, server.lastLessonDate),
    completedLessonIds: Array.from(new Set([...local.completedLessonIds, ...server.completedLessonIds])),
    selectedTopic: local.selectedTopic ?? server.selectedTopic ?? "flag",
    review,
    totalCorrect: Math.max(local.totalCorrect, server.totalCorrect),
    totalWrong: Math.max(local.totalWrong, server.totalWrong),
    daily: mergeDaily(local.daily, server.daily),
    arcade: Object.fromEntries(
      Array.from(new Set([...Object.keys(local.arcade), ...Object.keys(server.arcade)])).map((key) => [key, Math.max(local.arcade[key] ?? 0, server.arcade[key] ?? 0)])
    ),
    decks: mergeDecks(local.decks, server.decks)
  };
}
