import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { countries } from "@flaggo/core/data/countries";
import { deckCountries } from "@flaggo/core/utils/decks";
import { generateLessons, lessonsForTopic } from "@flaggo/core/utils/lessonGenerator";
import type { Country } from "@flaggo/core/types/country";
import type { Lesson } from "@flaggo/core/types/lesson";
import type { AppProgress } from "@flaggo/core/types/progress";
import type { Topic } from "@flaggo/core/types/topic";
import type { MapMode } from "@flaggo/core/utils/quiz";
import type { PopularityGroup } from "@flaggo/core/utils/popularity";
import { useAuth } from "../auth/AuthProvider";
import { BRAND } from "../config/brand";
import { useConfirm } from "../components/ConfirmDialog";
import { useSyncedProgress } from "../hooks/useSyncedProgress";
import { trackEvent } from "../lib/analytics";
import { supabase } from "../lib/supabase";
import { preloadFlags } from "../utils/preloadFlags";
import type { TestMode } from "../screens/TestSetupScreen";

type GameContextValue = {
  progress: AppProgress;
  setProgress: (progress: AppProgress) => void;
  resetAllProgress: () => Promise<void>;
  syncState: ReturnType<typeof useSyncedProgress>["syncState"];
  syncError: ReturnType<typeof useSyncedProgress>["syncError"];
  loading: boolean;
  lessons: Lesson[];
  countries: Country[];
  signInOpen: boolean;
  setSignInOpen: (open: boolean) => void;
  toast: string | null;
  setToast: (message: string | null) => void;
  openLesson: (lesson: Lesson) => void;
  startLearning: (topic?: Topic) => void;
  switchTopic: (topic: Topic) => void;
  startReview: (group: Country[], topic?: Topic) => void;
  startDeckPractice: (deck: AppProgress["decks"][number]) => void;
  startFlagTest: (group: PopularityGroup, mode: TestMode, topic: Topic) => void;
  startMapPractice: (mode: MapMode, group: Country[]) => void;
  startMapReview: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  signOutUser: () => Promise<void>;
  openSignIn: () => void;
  resetAll: () => Promise<void>;
  nextLearningLesson: (topic: Topic) => Lesson | undefined;
};

const GameContext = createContext<GameContextValue | null>(null);

function countryCodes(group: Country[]) {
  return group.map((country) => country.code);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { session, loading: authLoading } = useAuth();
  const { progress, setProgress, resetAllProgress, syncState, syncError, loading: progressLoading } = useSyncedProgress();
  const [signInOpen, setSignInOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const lessons = useMemo(() => generateLessons(countries), []);

  useEffect(() => preloadFlags(countries), []);

  useEffect(() => {
    trackEvent("app-open");
  }, []);

  useEffect(() => {
    if (syncError) {
      setToast("Sync needs attention");
      const id = window.setTimeout(() => setToast(null), 2200);
      return () => window.clearTimeout(id);
    }
  }, [syncError, syncState]);

  function openLesson(lesson: Lesson) {
    if (lesson.topic === "location") {
      navigate("/map/play", { state: { mode: "locate", countryCodes: lesson.countryCodes, lessonId: lesson.id } });
      return;
    }
    navigate("/lesson", { state: { lessonId: lesson.id } });
  }

  function firstOpenLesson(topic: Topic): Lesson | undefined {
    const completed = new Set(progress.completedLessonIds);
    return lessonsForTopic(lessons, topic).find((item) => !completed.has(item.id));
  }

  function nextLearningLesson(topic: Topic): Lesson | undefined {
    return firstOpenLesson(topic) ?? firstOpenLesson("flag") ?? firstOpenLesson("capital");
  }

  function startLearning(topic: Topic = progress.selectedTopic) {
    const next = nextLearningLesson(topic);
    if (next) openLesson(next);
    else navigate("/learn");
  }

  function switchTopic(topic: Topic) {
    setProgress({ ...progress, selectedTopic: topic });
    trackEvent("topic-switch", { topic });
  }

  function startReview(group: Country[], topic = progress.selectedTopic) {
    navigate("/lesson", { state: { mode: "review", countryCodes: countryCodes(group), topic } });
  }

  function startDeckPractice(deck: AppProgress["decks"][number]) {
    const group = deckCountries(deck, countries);
    if (!group.length) return;
    trackEvent("deck_practice", { id: deck.id, size: group.length, topic: deck.topic });
    startReview(group, deck.topic);
  }

  function startFlagTest(group: PopularityGroup, mode: TestMode, topic: Topic) {
    navigate("/test", { state: { countryCodes: countryCodes(group.countries), mode, topic } });
  }

  function startMapPractice(mode: MapMode, group: Country[]) {
    trackEvent("map-play", { mode });
    navigate("/map/play", { state: { mode, countryCodes: countryCodes(group) } });
  }

  async function startMapReview() {
    const [{ default: world110m }, geo, srs] = await Promise.all([
      import("@flaggo/core/data/world-110m.json"),
      import("@flaggo/core/utils/geo"),
      import("@flaggo/core/utils/spacedRepetition")
    ]);
    const available = geo.mapPresentCountries(countries, world110m);
    const due = srs.getDueCountries(progress, available, "location").slice(0, 8);
    const weak = srs.getWeakCountries(progress, available, "location").slice(0, 8);
    startMapPractice("locate", due.length ? due : weak.length ? weak : available.slice(0, 8));
  }

  async function resetAll() {
    await resetAllProgress();
    navigate("/welcome", { replace: true });
  }

  async function signOutUser() {
    await supabase?.auth.signOut();
    setToast("Signed out");
  }

  async function deleteAccount() {
    if (!session) return;
    const ok = await confirm({
      title: "Delete account?",
      body: `Delete your ${BRAND.name} account and all synced data?`,
      confirmLabel: "Delete account",
      destructive: true
    });
    if (!ok) return;
    const response = await fetch("/.netlify/functions/delete-account", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (response.ok) {
      await supabase?.auth.signOut();
      await resetAll();
      setToast("Account deleted");
    } else {
      setToast("Account deletion failed");
    }
  }

  const value: GameContextValue = {
    progress,
    setProgress,
    resetAllProgress,
    syncState,
    syncError,
    loading: authLoading || progressLoading,
    lessons,
    countries,
    signInOpen,
    setSignInOpen,
    toast,
    setToast,
    openLesson,
    startLearning,
    switchTopic,
    startReview,
    startDeckPractice,
    startFlagTest,
    startMapPractice,
    startMapReview,
    deleteAccount,
    signOutUser,
    openSignIn: () => setSignInOpen(true),
    resetAll,
    nextLearningLesson,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used within GameProvider");
  return value;
}
