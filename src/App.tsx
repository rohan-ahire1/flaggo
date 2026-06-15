import { useEffect, useMemo, useState } from "react";
import BottomNav from "./components/BottomNav";
import { countries } from "./data/countries";
import type { Country } from "./types/country";
import type { Lesson } from "./types/lesson";
import type { AppProgress } from "./types/progress";
import { generateLessons } from "./utils/lessonGenerator";
import { preloadFlags } from "./utils/preloadFlags";
import { loadProgress, resetProgress, saveProgress } from "./utils/storage";
import FlagsLibraryScreen from "./screens/FlagsLibraryScreen";
import HomeScreen from "./screens/HomeScreen";
import LessonCompleteScreen, { type LessonResult } from "./screens/LessonCompleteScreen";
import LessonScreen from "./screens/LessonScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ReviewScreen from "./screens/ReviewScreen";
import StatsScreen from "./screens/StatsScreen";
import FlagTestScreen from "./screens/FlagTestScreen";
import TestSetupScreen, { type TestMode } from "./screens/TestSetupScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import type { PopularityGroup } from "./utils/popularity";

export type Screen = "welcome" | "home" | "lesson" | "complete" | "stats" | "library" | "review" | "profile" | "testSetup" | "flagTest";

export default function App() {
  const [progress, setProgress] = useState<AppProgress>(() => loadProgress());
  const [screen, setScreen] = useState<Screen>(() => {
    const loaded = loadProgress();
    return loaded.xp || loaded.completedLessonIds.length || Object.keys(loaded.review).length ? "home" : "welcome";
  });
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>();
  const [reviewCountries, setReviewCountries] = useState<Country[]>([]);
  const [testCountries, setTestCountries] = useState<Country[]>([]);
  const [testMode, setTestMode] = useState<TestMode>("recall");
  const [result, setResult] = useState<LessonResult | null>(null);
  const lessons = useMemo(() => generateLessons(countries), []);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => preloadFlags(countries), []);

  function updateProgress(next: AppProgress) {
    setProgress(next);
  }

  function openLesson(lesson: Lesson) {
    const completed = new Set(progress.completedLessonIds);
    const index = lessons.findIndex((item) => item.id === lesson.id);
    const firstOpen = lessons.findIndex((item) => !completed.has(item.id));
    if (!completed.has(lesson.id) && index !== Math.max(0, firstOpen)) return;
    setActiveLesson(lesson);
    setScreen("lesson");
  }

  function startReview(group: Country[]) {
    setReviewCountries(group);
    setActiveLesson(undefined);
    setScreen("lesson");
  }

  function finishLesson(nextResult: LessonResult) {
    setResult(nextResult);
    setScreen("complete");
  }

  function startFlagTest(group: PopularityGroup, mode: TestMode) {
    setTestCountries(group.countries);
    setTestMode(mode);
    setScreen("flagTest");
  }

  function resetAll() {
    resetProgress();
    const fresh = loadProgress();
    setProgress(fresh);
    setActiveLesson(undefined);
    setReviewCountries([]);
    setTestCountries([]);
    setResult(null);
    setScreen("welcome");
  }

  const showNav = !["welcome", "lesson", "complete", "flagTest"].includes(screen);

  return (
    <div className="min-h-screen bg-flaggo-bg">
      <div className="mx-auto min-h-screen max-w-md bg-flaggo-bg">
        {screen === "welcome" && <WelcomeScreen onStart={() => setScreen("home")} onExplore={() => setScreen("library")} />}
        {screen === "home" && <HomeScreen progress={progress} lessons={lessons} onOpenLesson={openLesson} />}
        {screen === "lesson" && (
          <LessonScreen
            lesson={activeLesson}
            countries={countries}
            progress={progress}
            mode={activeLesson ? "lesson" : "review"}
            reviewCountries={reviewCountries}
            onProgress={updateProgress}
            onComplete={finishLesson}
            onHome={() => setScreen("home")}
          />
        )}
        {screen === "complete" && result && <LessonCompleteScreen result={result} onContinue={() => setScreen("home")} />}
        {screen === "library" && <FlagsLibraryScreen countries={countries} progress={progress} onPractice={(country) => startReview([country])} />}
        {screen === "review" && <ReviewScreen countries={countries} progress={progress} onStart={startReview} onOpenTest={() => setScreen("testSetup")} />}
        {screen === "testSetup" && <TestSetupScreen countries={countries} onStart={startFlagTest} />}
        {screen === "flagTest" && (
          <FlagTestScreen
            countries={testCountries}
            allCountries={countries}
            mode={testMode}
            progress={progress}
            onProgress={updateProgress}
            onDone={() => setScreen("review")}
          />
        )}
        {screen === "stats" && <StatsScreen countries={countries} progress={progress} completedCount={progress.completedLessonIds.length} />}
        {screen === "profile" && <ProfileScreen progress={progress} onReset={resetAll} />}
        {showNav && <BottomNav active={screen} onNavigate={setScreen} />}
      </div>
    </div>
  );
}
