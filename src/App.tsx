import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import AdConsentBanner from "./ads/AdConsentBanner";
import { useAuth } from "./auth/AuthProvider";
import SignInModal from "./auth/SignInModal";
import BottomNav from "./components/BottomNav";
import AppFooter from "./components/AppFooter";
import Toast from "./components/Toast";
import { countries } from "./data/countries";
import { useSyncedProgress } from "./hooks/useSyncedProgress";
import { trackEvent } from "./lib/analytics";
import { BRAND } from "./config/brand";
import { supabase } from "./lib/supabase";
import type { Country } from "./types/country";
import type { Lesson } from "./types/lesson";
import type { AppProgress } from "./types/progress";
import type { Topic } from "./types/topic";
import { generateLessons, lessonsForTopic } from "./utils/lessonGenerator";
import { preloadFlags } from "./utils/preloadFlags";
import { loadProgress } from "./utils/storage";
import { deckCountries } from "./utils/decks";
import { submitScore, xpBoard } from "./lib/leaderboard";
import { createMatch, defaultMatchConfig, matchUrl } from "./lib/matches";
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
import type { MapMode } from "./utils/quiz";

const MapMenuScreen = lazy(() => import("./screens/MapMenuScreen"));
const MapPlayScreen = lazy(() => import("./screens/MapPlayScreen"));
const ExploreMapScreen = lazy(() => import("./screens/ExploreMapScreen"));
const DailyChallengeScreen = lazy(() => import("./screens/DailyChallengeScreen"));
const PathsScreen = lazy(() => import("./screens/PathsScreen"));
const ArcadeScreen = lazy(() => import("./screens/ArcadeScreen"));
const DecksScreen = lazy(() => import("./screens/DecksScreen"));
const LeaderboardScreen = lazy(() => import("./screens/LeaderboardScreen"));
const TriviaScreen = lazy(() => import("./screens/TriviaScreen"));
const MatchScreen = lazy(() => import("./screens/MatchScreen"));
const MatchResultScreen = lazy(() => import("./screens/MatchResultScreen"));
const FriendsScreen = lazy(() => import("./screens/FriendsScreen"));

export type Screen = "welcome" | "home" | "lesson" | "complete" | "stats" | "library" | "review" | "profile" | "testSetup" | "flagTest" | "mapMenu" | "mapPlay" | "exploreMap" | "daily" | "paths" | "arcade" | "decks" | "leaderboard" | "trivia" | "match" | "matchResult" | "friends";

export default function App() {
  const { user, session, displayName, loading: authLoading } = useAuth();
  const { progress, setProgress, resetAllProgress, syncState, syncError, loading: progressLoading } = useSyncedProgress();
  const [signInOpen, setSignInOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>(() => {
    const loaded = loadProgress();
    return loaded.xp || loaded.completedLessonIds.length || Object.keys(loaded.review).length ? "home" : "welcome";
  });
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>();
  const [reviewCountries, setReviewCountries] = useState<Country[]>([]);
  const [reviewTopic, setReviewTopic] = useState<Topic>("flag");
  const [testCountries, setTestCountries] = useState<Country[]>([]);
  const [testMode, setTestMode] = useState<TestMode>("recall");
  const [testTopic, setTestTopic] = useState<Topic>("flag");
  const [mapCountries, setMapCountries] = useState<Country[]>([]);
  const [mapMode, setMapMode] = useState<MapMode>("locate");
  const [result, setResult] = useState<LessonResult | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const lessons = useMemo(() => generateLessons(countries), []);

  useEffect(() => preloadFlags(countries), []);
  useEffect(() => {
    trackEvent("app-open");
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    const matchId = url.searchParams.get("m");
    if (!matchId) return;
    setActiveMatchId(matchId);
    setScreen("match");
    url.searchParams.delete("m");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
  useEffect(() => {
    if (syncState === "saved") {
      setToast("Progress saved");
      const id = window.setTimeout(() => setToast(null), 1600);
      return () => window.clearTimeout(id);
    }
    if (syncError) {
      setToast("Sync needs attention");
      const id = window.setTimeout(() => setToast(null), 2200);
      return () => window.clearTimeout(id);
    }
  }, [syncError, syncState]);
  useEffect(() => {
    if (user && displayName?.trim() && progress.xp > 0) void submitScore(xpBoard(), progress.xp, displayName);
  }, [displayName, progress.xp, user]);

  function updateProgress(next: AppProgress) {
    setProgress(next);
  }

  function openLesson(lesson: Lesson) {
    const completed = new Set(progress.completedLessonIds);
    const topicLessons = lessonsForTopic(lessons, lesson.topic);
    const index = topicLessons.findIndex((item) => item.id === lesson.id);
    const firstOpen = topicLessons.findIndex((item) => !completed.has(item.id));
    if (!completed.has(lesson.id) && index !== Math.max(0, firstOpen)) return;
    setActiveLesson(lesson);
    setScreen("lesson");
  }

  function switchTopic(topic: Topic) {
    updateProgress({ ...progress, selectedTopic: topic });
    trackEvent("topic-switch", { topic });
  }

  function startReview(group: Country[], topic = progress.selectedTopic) {
    setReviewCountries(group);
    setReviewTopic(topic);
    setActiveLesson(undefined);
    setScreen("lesson");
  }

  function startDeckPractice(deck: AppProgress["decks"][number]) {
    const group = deckCountries(deck, countries);
    if (!group.length) return;
    trackEvent("deck_practice", { id: deck.id, size: group.length, topic: deck.topic });
    startReview(group, deck.topic);
  }

  function finishLesson(nextResult: LessonResult) {
    setResult(nextResult);
    trackEvent("lesson-complete", { accuracy: nextResult.accuracy, topic: nextResult.topic });
    setScreen("complete");
  }

  function startFlagTest(group: PopularityGroup, mode: TestMode, topic: Topic) {
    setTestCountries(group.countries);
    setTestMode(mode);
    setTestTopic(topic);
    setScreen("flagTest");
  }

  function startMapPractice(mode: MapMode, group: Country[]) {
    setMapCountries(group);
    setMapMode(mode);
    trackEvent("map-play", { mode });
    setScreen("mapPlay");
  }

  async function startMapReview() {
    const [{ default: world110m }, geo, srs] = await Promise.all([
      import("./data/world-110m.json"),
      import("./utils/geo"),
      import("./utils/spacedRepetition")
    ]);
    const available = geo.mapPresentCountries(countries, world110m);
    const due = srs.getDueCountries(progress, available, "location").slice(0, 8);
    const weak = srs.getWeakCountries(progress, available, "location").slice(0, 8);
    startMapPractice("locate", due.length ? due : weak.length ? weak : available.slice(0, 8));
  }

  async function resetAll() {
    await resetAllProgress();
    setActiveLesson(undefined);
    setReviewCountries([]);
    setTestCountries([]);
    setMapCountries([]);
    setResult(null);
    setScreen("welcome");
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setToast("Signed out");
  }

  async function deleteAccount() {
    if (!session || !window.confirm(`Delete your ${BRAND.name} account and all synced data?`)) return;
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

  async function createAndShareChallenge() {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    try {
      const match = await createMatch(defaultMatchConfig());
      const url = matchUrl(match.id);
      const text = `Take my ${BRAND.name} challenge: ${url}`;
      if (navigator.share) await navigator.share({ text, url });
      else await navigator.clipboard?.writeText(text);
      setActiveMatchId(match.id);
      setScreen("matchResult");
      setToast("Challenge link ready");
      window.setTimeout(() => setToast(null), 1600);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not create challenge");
      window.setTimeout(() => setToast(null), 2200);
    }
  }

  const showNav = !["welcome", "lesson", "complete", "flagTest", "mapPlay", "daily", "arcade", "trivia", "match", "matchResult"].includes(screen);
  const showFooter = showNav;
  const loading = authLoading || progressLoading;

  return (
    <div className="min-h-screen bg-flaggo-bg md:grid md:place-items-start">
      <Toast message={toast} />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <AdConsentBanner />
      <div className="mx-auto flex h-[100dvh] max-w-md flex-col bg-flaggo-bg md:my-6 md:h-[calc(100dvh-3rem)] md:w-full md:max-w-2xl md:overflow-hidden md:rounded-[30px] md:border md:border-flaggo-border md:shadow-soft lg:max-w-3xl">
        <main className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-5 pt-4">
            <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
          </div>
        )}
        {screen === "welcome" && <WelcomeScreen onStart={() => setScreen("home")} onExplore={() => setScreen("library")} />}
        {screen === "home" && (
          <HomeScreen
            progress={progress}
            lessons={lessons}
            onOpenLesson={openLesson}
            onTopicChange={switchTopic}
            onOpenMap={() => setScreen("mapMenu")}
            onOpenDaily={() => setScreen("daily")}
            onOpenPaths={() => setScreen("paths")}
            onOpenArcade={() => setScreen("arcade")}
            onOpenTrivia={() => setScreen("trivia")}
            onOpenDecks={() => setScreen("decks")}
            onOpenLeaderboard={() => setScreen("leaderboard")}
            onOpenFriends={() => setScreen("friends")}
            onChallenge={() => void createAndShareChallenge()}
          />
        )}
        {screen === "lesson" && (
          <LessonScreen
            lesson={activeLesson}
            countries={countries}
            progress={progress}
            mode={activeLesson ? "lesson" : "review"}
            reviewCountries={reviewCountries}
            reviewTopic={reviewTopic}
            onProgress={updateProgress}
            onComplete={finishLesson}
            onHome={() => setScreen("home")}
          />
        )}
        {screen === "complete" && result && <LessonCompleteScreen result={result} onContinue={() => setScreen("home")} />}
        {screen === "library" && (
          <FlagsLibraryScreen
            countries={countries}
            progress={progress}
            onProgress={updateProgress}
            onPractice={(country) => startReview([country], progress.selectedTopic)}
            onExploreMap={() => setScreen("exploreMap")}
          />
        )}
        {screen === "daily" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <DailyChallengeScreen countries={countries} progress={progress} onProgress={updateProgress} onHome={() => setScreen("home")} onOpenLeaderboard={() => setScreen("leaderboard")} onSignIn={() => setSignInOpen(true)} onChallenge={() => void createAndShareChallenge()} />
          </Suspense>
        )}
        {screen === "paths" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <PathsScreen lessons={lessons} progress={progress} onOpenLesson={openLesson} onBack={() => setScreen("home")} />
          </Suspense>
        )}
        {screen === "arcade" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <ArcadeScreen countries={countries} progress={progress} onProgress={updateProgress} onBack={() => setScreen("home")} onOpenLeaderboard={() => setScreen("leaderboard")} onSignIn={() => setSignInOpen(true)} onChallenge={() => void createAndShareChallenge()} />
          </Suspense>
        )}
        {screen === "trivia" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <TriviaScreen countries={countries} progress={progress} onProgress={updateProgress} onBack={() => setScreen("home")} />
          </Suspense>
        )}
        {screen === "decks" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <DecksScreen countries={countries} progress={progress} onProgress={updateProgress} onPractice={startDeckPractice} onBack={() => setScreen("home")} />
          </Suspense>
        )}
        {screen === "leaderboard" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <LeaderboardScreen onBack={() => setScreen("home")} onSignIn={() => setSignInOpen(true)} onChallenge={() => void createAndShareChallenge()} onOpenFriends={() => setScreen("friends")} />
          </Suspense>
        )}
        {screen === "friends" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <FriendsScreen onBack={() => setScreen("home")} onChallenge={() => void createAndShareChallenge()} onSignIn={() => setSignInOpen(true)} />
          </Suspense>
        )}
        {screen === "match" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <MatchScreen matchId={activeMatchId} countries={countries} onDone={(id) => { setActiveMatchId(id); setScreen("matchResult"); }} onBack={() => setScreen("home")} onSignIn={() => setSignInOpen(true)} />
          </Suspense>
        )}
        {screen === "matchResult" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <MatchResultScreen matchId={activeMatchId} onBack={() => setScreen("home")} onOpenMatch={(id) => { setActiveMatchId(id); setScreen("match"); }} onSignIn={() => setSignInOpen(true)} />
          </Suspense>
        )}
        {screen === "review" && <ReviewScreen countries={countries} progress={progress} onStart={startReview} onOpenTest={() => setScreen("testSetup")} onOpenMapPractice={startMapReview} />}
        {screen === "testSetup" && <TestSetupScreen countries={countries} selectedTopic={progress.selectedTopic} onStart={startFlagTest} />}
        {screen === "flagTest" && (
          <FlagTestScreen
            countries={testCountries}
            allCountries={countries}
            mode={testMode}
            topic={testTopic}
            progress={progress}
            onProgress={updateProgress}
            onDone={() => setScreen("review")}
          />
        )}
        {screen === "mapMenu" && (
          <Suspense fallback={<div className="p-5"><div className="h-40 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <MapMenuScreen countries={countries} onStart={startMapPractice} onExplore={() => setScreen("exploreMap")} />
          </Suspense>
        )}
        {screen === "mapPlay" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <MapPlayScreen
              countries={mapCountries}
              mode={mapMode}
              progress={progress}
              onProgress={updateProgress}
              onComplete={finishLesson}
              onExit={() => setScreen("mapMenu")}
            />
          </Suspense>
        )}
        {screen === "exploreMap" && (
          <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-white shadow-card" /></div>}>
            <ExploreMapScreen countries={countries} />
          </Suspense>
        )}
        {screen === "stats" && (
          <StatsScreen countries={countries} lessons={lessons} progress={progress} />
        )}
        {screen === "profile" && (
          <ProfileScreen
            progress={progress}
            onReset={resetAll}
            userEmail={user?.email ?? null}
            syncState={syncState}
            syncError={syncError}
            onSignIn={() => setSignInOpen(true)}
            onSignOut={signOut}
            onDeleteAccount={deleteAccount}
          />
        )}
        {showFooter && <AppFooter />}
        </main>
        {showNav && <BottomNav active={screen} onNavigate={setScreen} />}
      </div>
    </div>
  );
}
