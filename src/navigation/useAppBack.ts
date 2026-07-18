import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Browser history can be empty when a screen is opened from a bookmark, a PWA
// shortcut, or a refreshed deep link. In that case, always stay inside Flaggo.
export function useAppBack(fallback: string) {
  const navigate = useNavigate();

  return useCallback(() => {
    const index = window.history.state?.idx;
    if (typeof index === "number" && index > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [fallback, navigate]);
}
