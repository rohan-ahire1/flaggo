import { Fragment, lazy, useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./AppLayout";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { InstallPromptProvider } from "./components/InstallPromptProvider";
import { GameProvider } from "./state/GameProvider";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { PrivacyPage, TermsPage } from "./pages/LegalPages";
import NotFoundPage from "./pages/NotFoundPage";
import { loadPlausible, trackEvent } from "./lib/analytics";
import { queryClient } from "./lib/queryClient";
import HomeScreen from "./screens/HomeScreen";
import ReviewRoundScreen from "./screens/ReviewRoundScreen";
import ReviewScreen from "./screens/ReviewScreen";
import TestSetupScreen from "./screens/TestSetupScreen";
import FlagTestScreen from "./screens/FlagTestScreen";
import FlagsLibraryScreen from "./screens/FlagsLibraryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import StatsScreen from "./screens/StatsScreen";
import WelcomeScreen from "./screens/WelcomeScreen";

const MapMenuScreen = lazy(() => import("./screens/MapMenuScreen"));
const FlashcardsScreen = lazy(() => import("./screens/FlashcardsScreen"));
const MapPlayScreen = lazy(() => import("./screens/MapPlayScreen"));
const ExploreMapScreen = lazy(() => import("./screens/ExploreMapScreen"));
const DailyChallengeScreen = lazy(() => import("./screens/DailyChallengeScreen"));
const ArcadeScreen = lazy(() => import("./screens/ArcadeScreen"));
const DecksScreen = lazy(() => import("./screens/DecksScreen"));
const TriviaScreen = lazy(() => import("./screens/TriviaScreen"));
const KidsHomeScreen = lazy(() => import("./screens/kids/KidsHomeScreen"));
const ContinentScreen = lazy(() => import("./screens/kids/ContinentScreen"));
const LearnFlagsScreen = lazy(() => import("./screens/kids/LearnFlagsScreen"));
const FindFlagScreen = lazy(() => import("./screens/kids/FindFlagScreen"));
const FlagMatchScreen = lazy(() => import("./screens/kids/FlagMatchScreen"));
const StickerBookScreen = lazy(() => import("./screens/kids/StickerBookScreen"));

function RoundRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <Fragment key={location.key}>{children}</Fragment>;
}

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    loadPlausible();
  }, []);
  useEffect(() => {
    trackEvent("pageview", { path: location.pathname });
  }, [location.pathname]);
  return null;
}

export default function AppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>
        <InstallPromptProvider>
        <GameProvider>
          <PageTracker />
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/welcome" element={<WelcomeScreen />} />
              <Route path="/learn/*" element={<Navigate to="/" replace />} />
              <Route path="/review" element={<ReviewScreen />} />
              <Route path="/review/flashcards" element={<RoundRoute><FlashcardsScreen /></RoundRoute>} />
              <Route path="/review/play" element={<RoundRoute><ReviewRoundScreen /></RoundRoute>} />
              <Route path="/lesson" element={<Navigate to="/review" replace />} />
              <Route path="/test-setup" element={<TestSetupScreen />} />
              <Route path="/test" element={<RoundRoute><FlagTestScreen /></RoundRoute>} />
              <Route path="/daily" element={<DailyChallengeScreen />} />
              <Route path="/arcade" element={<ArcadeScreen />} />
              <Route path="/trivia" element={<TriviaScreen />} />
              <Route path="/map" element={<MapMenuScreen />} />
              <Route path="/map/play" element={<RoundRoute><MapPlayScreen /></RoundRoute>} />
              <Route path="/map/explore" element={<ExploreMapScreen />} />
              <Route path="/decks" element={<DecksScreen />} />
              <Route path="/library" element={<FlagsLibraryScreen />} />
              <Route path="/kids" element={<KidsHomeScreen />} />
              <Route path="/kids/region/:region" element={<ContinentScreen />} />
              <Route path="/kids/learn/:region" element={<RoundRoute><LearnFlagsScreen /></RoundRoute>} />
              <Route path="/kids/find/:region" element={<RoundRoute><FindFlagScreen /></RoundRoute>} />
              <Route path="/kids/match/:region" element={<RoundRoute><FlagMatchScreen /></RoundRoute>} />
              <Route path="/kids/stickers" element={<StickerBookScreen />} />
              <Route path="/stats" element={<StatsScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </GameProvider>
        </InstallPromptProvider>
        </ConfirmProvider>
      </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
