import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthProvider } from "./auth/AuthProvider";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { PrivacyPage, TermsPage } from "./pages/LegalPages";
import NotFoundPage from "./pages/NotFoundPage";
import { loadPlausible, trackEvent } from "./lib/analytics";

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
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <PageTracker />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
