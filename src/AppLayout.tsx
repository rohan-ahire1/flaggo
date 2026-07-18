import { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdConsentBanner from "./ads/AdConsentBanner";
import SignInModal from "./auth/SignInModal";
import AppFooter from "./components/AppFooter";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";
import { useGame } from "./state/GameProvider";

const HIDE_CHROME_PREFIXES = [
  "/welcome",
  "/lesson",
  "/test",
  "/map/play",
  "/daily",
  "/arcade",
  "/trivia"
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const welcomeChecked = useRef(false);
  const { progress, loading, toast, signInOpen, setSignInOpen } = useGame();
  const hideChrome = HIDE_CHROME_PREFIXES.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (welcomeChecked.current || loading || location.pathname !== "/") return;
    welcomeChecked.current = true;
    const hasProgress = progress.xp || progress.completedLessonIds.length || Object.keys(progress.review).length;
    if (!hasProgress) navigate("/welcome", { replace: true });
  }, [loading, location.pathname, navigate, progress]);

  return (
    <div className="min-h-screen bg-paper md:grid md:place-items-start">
      <Toast message={toast} />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <AdConsentBanner />
      <div className="mx-auto flex h-[100dvh] max-w-md flex-col bg-paper md:my-6 md:h-[calc(100dvh-3rem)] md:w-full md:max-w-2xl md:overflow-hidden md:rounded-[30px] md:border md:border-line md:shadow-soft lg:max-w-3xl">
        <main className="no-scrollbar flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-5 pt-4">
              <div className="h-3 w-32 animate-pulse rounded-full bg-surface2" />
            </div>
          ) : (
            <Suspense fallback={<div className="p-5"><div className="h-96 animate-pulse rounded-[24px] bg-paper shadow-card" /></div>}>
              <Outlet />
            </Suspense>
          )}
          {!hideChrome && <AppFooter />}
        </main>
        {!hideChrome && <BottomNav />}
      </div>
    </div>
  );
}
