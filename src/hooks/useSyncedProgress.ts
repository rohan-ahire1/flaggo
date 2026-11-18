import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { defaultProgress, type AppProgress } from "@flaggo/core/types/progress";
import { clearAnonymousMergeMarker, loadProgress, resetProgress, saveProgress, saveSyncedProgress } from "../utils/storage";
import { mergeProgress, normalizeProgress } from "@flaggo/core/utils/progressMerge";

type SyncState = "local" | "loading" | "saved" | "saving" | "error";
type PendingSave = { userId: string; data: AppProgress };

export function useSyncedProgress() {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgressState] = useState<AppProgress>(() => loadProgress());
  const [syncState, setSyncState] = useState<SyncState>("local");
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const hydratedUser = useRef<string | null>(null);
  // Latest progress not yet confirmed uploaded. Kept after a failed upsert so it can be retried.
  const pending = useRef<PendingSave | null>(null);
  const inFlight = useRef<PendingSave | null>(null);

  const flush = useCallback(async () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const item = pending.current;
    const client = supabase;
    if (!item || !client || inFlight.current === item) return;
    inFlight.current = item;
    let upsertError: { message: string } | null = null;
    try {
      const result = await client
        .from("progress")
        .upsert({ user_id: item.userId, data: item.data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      upsertError = result.error;
    } catch (e) {
      upsertError = { message: e instanceof Error ? e.message : "Sync failed" };
    }
    if (inFlight.current === item) inFlight.current = null;
    // Newer progress or a reset replaced this save; the newer path reports its own state.
    if (pending.current !== item) return;
    if (upsertError) {
      setError(upsertError.message);
      setSyncState("error");
    } else {
      pending.current = null;
      setError(null);
      setSyncState("saved");
    }
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      // Hidden: upload now. Visible: retry anything that failed earlier.
      void flush();
    };
    const onPageHide = () => void flush();
    const onOnline = () => void flush();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onOnline);
    };
  }, [flush]);

  useEffect(() => {
    if (authLoading) return;
    const client = supabase;
    if (!user || !client) {
      hydratedUser.current = null;
      setSyncState("local");
      return;
    }
    if (hydratedUser.current === user.id) return;

    let active = true;
    setSyncState("loading");
    setError(null);

    client
      .from("progress")
      .select("data, updated_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          setError(fetchError.message);
          setSyncState("error");
          return;
        }

        const local = loadProgress();
        const serverProgress = normalizeProgress(data?.data as Partial<AppProgress> | null);
        const next = mergeProgress(local, serverProgress);
        const updatedAt = new Date().toISOString();

        const { error: upsertError } = await client
          .from("progress")
          .upsert({ user_id: user.id, data: next, updated_at: updatedAt }, { onConflict: "user_id" });

        if (!active) return;
        if (upsertError) {
          setError(upsertError.message);
          setSyncState("error");
          return;
        }

        hydratedUser.current = user.id;
        clearAnonymousMergeMarker();
        saveSyncedProgress(next, { updatedAt, userId: user.id });
        setProgressState(next);
        setSyncState("saved");
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const setProgress = useCallback(
    (next: AppProgress) => {
      setProgressState(next);
      if (!user || !supabase) {
        saveProgress(next);
        setSyncState("local");
        return;
      }
      const updatedAt = new Date().toISOString();
      saveSyncedProgress(next, { updatedAt, userId: user.id });
      setSyncState("saving");
      pending.current = { userId: user.id, data: next };
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => void flush(), 2000);
    },
    [user, flush]
  );

  const resetAllProgress = useCallback(async () => {
    // A queued save would otherwise push the old progress back over the reset.
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    pending.current = null;
    resetProgress();
    setProgressState(defaultProgress);
    const client = supabase;
    if (user && client) {
      const updatedAt = new Date().toISOString();
      const { error: resetError } = await client.from("progress").upsert({ user_id: user.id, data: defaultProgress, updated_at: updatedAt }, { onConflict: "user_id" });
      if (resetError) {
        setError(resetError.message);
        setSyncState("error");
        return;
      }
      saveSyncedProgress(defaultProgress, { updatedAt, userId: user.id });
      setSyncState("saved");
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  return { progress, setProgress, resetAllProgress, syncState, syncError: error, loading: authLoading || syncState === "loading" };
}
