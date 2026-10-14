import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { defaultProgress, type AppProgress } from "@flaggo/core/types/progress";
import { clearAnonymousMergeMarker, loadProgress, resetProgress, saveProgress, saveSyncedProgress } from "../utils/storage";
import { mergeProgress, normalizeProgress } from "@flaggo/core/utils/progressMerge";

type SyncState = "local" | "loading" | "saved" | "saving" | "error";

export function useSyncedProgress() {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgressState] = useState<AppProgress>(() => loadProgress());
  const [syncState, setSyncState] = useState<SyncState>("local");
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const hydratedUser = useRef<string | null>(null);

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
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        const client = supabase;
        if (!client) return;
        const { error: upsertError } = await client
          .from("progress")
          .upsert({ user_id: user.id, data: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        if (upsertError) {
          setError(upsertError.message);
          setSyncState("error");
        } else {
          setError(null);
          setSyncState("saved");
        }
      }, 2000);
    },
    [user]
  );

  const resetAllProgress = useCallback(async () => {
    // A queued save would otherwise push the old progress back over the reset.
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
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
