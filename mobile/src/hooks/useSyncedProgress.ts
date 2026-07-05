import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { defaultProgress, type AppProgress } from "@flaggo/core/types/progress";
import {
  clearAnonymousMergeMarker,
  loadProgress,
  loadProgressMeta,
  needsAnonymousMerge,
  resetProgress,
  saveProgress,
  saveSyncedProgress
} from "../utils/storage";
import { mergeProgress, normalizeProgress } from "@flaggo/core/utils/progressMerge";

type SyncState = "local" | "loading" | "saved" | "saving" | "error";

export function useSyncedProgress() {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgressState] = useState<AppProgress>(defaultProgress);
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("local");
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedUser = useRef<string | null>(null);

  // Load the local (SQLite) progress once on mount.
  useEffect(() => {
    let active = true;
    loadProgress().then((local) => {
      if (!active) return;
      setProgressState(local);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // When signed in, hydrate + merge with the Supabase copy.
  useEffect(() => {
    if (authLoading || !hydrated) return;
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

        const local = await loadProgress();
        const meta = await loadProgressMeta();
        const serverProgress = normalizeProgress(data?.data as Partial<AppProgress> | null);
        const serverUpdatedAt = data?.updated_at ? String(data.updated_at) : null;
        const shouldMerge = (await needsAnonymousMerge()) || meta.userId !== user.id;
        const serverNewer =
          serverUpdatedAt && meta.updatedAt
            ? new Date(serverUpdatedAt).getTime() > new Date(meta.updatedAt).getTime()
            : Boolean(serverUpdatedAt);
        const next = shouldMerge ? mergeProgress(local, serverProgress) : serverNewer ? serverProgress : local;
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
        await clearAnonymousMergeMarker();
        await saveSyncedProgress(next, { updatedAt, userId: user.id });
        setProgressState(next);
        setSyncState("saved");
      });

    return () => {
      active = false;
    };
  }, [authLoading, hydrated, user]);

  const setProgress = useCallback(
    (next: AppProgress) => {
      setProgressState(next);
      if (!user || !supabase) {
        void saveProgress(next);
        setSyncState("local");
        return;
      }
      const updatedAt = new Date().toISOString();
      void saveSyncedProgress(next, { updatedAt, userId: user.id });
      setSyncState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
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
    await resetProgress();
    setProgressState(defaultProgress);
    const client = supabase;
    if (user && client) {
      const updatedAt = new Date().toISOString();
      const { error: resetError } = await client
        .from("progress")
        .upsert({ user_id: user.id, data: defaultProgress, updated_at: updatedAt }, { onConflict: "user_id" });
      if (resetError) {
        setError(resetError.message);
        setSyncState("error");
        return;
      }
      await saveSyncedProgress(defaultProgress, { updatedAt, userId: user.id });
      setSyncState("saved");
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return {
    progress,
    setProgress,
    resetAllProgress,
    syncState,
    syncError: error,
    loading: authLoading || !hydrated || syncState === "loading"
  };
}
