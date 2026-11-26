import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProgress, type AppProgress } from "@flaggo/core/types/progress";
import { mergeProgress } from "@flaggo/core/utils/progressMerge";
import { loadProgress, needsAnonymousMerge, saveProgress } from "../../utils/storage";
import { useSyncedProgress } from "../useSyncedProgress";

const mocks = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false },
  maybeSingle: vi.fn(),
  upsert: vi.fn()
}));

vi.mock("../../auth/AuthProvider", () => ({ useAuth: () => mocks.auth }));

vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
      upsert: mocks.upsert
    }))
  }
}));

const user = { id: "user-1" };
const withXp = (xp: number): AppProgress => ({ ...defaultProgress, xp });

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  mocks.auth.user = null;
  mocks.auth.loading = false;
  mocks.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
  mocks.upsert.mockReset().mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSyncedProgress", () => {
  it("saves locally and never upserts when signed out", async () => {
    const { result } = renderHook(() => useSyncedProgress());
    await flush();

    act(() => result.current.setProgress(withXp(10)));
    await advance(5000);

    expect(loadProgress().xp).toBe(10);
    expect(result.current.syncState).toBe("local");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("merges local and server progress on sign-in and upserts once", async () => {
    saveProgress(withXp(50));
    expect(needsAnonymousMerge()).toBe(true);
    mocks.auth.user = user;
    mocks.maybeSingle.mockResolvedValue({ data: { data: withXp(80), updated_at: "2026-01-01T00:00:00Z" }, error: null });

    const { result } = renderHook(() => useSyncedProgress());
    await flush();

    const merged = mergeProgress(withXp(50), withXp(80));
    expect(merged.xp).toBe(80);
    expect(result.current.progress).toEqual(merged);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.upsert.mock.calls[0][0]).toMatchObject({ user_id: "user-1", data: merged });
    expect(result.current.syncState).toBe("saved");
    expect(needsAnonymousMerge()).toBe(false);
  });

  it("reports fetch errors", async () => {
    mocks.auth.user = user;
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });

    const { result } = renderHook(() => useSyncedProgress());
    await flush();

    expect(result.current.syncState).toBe("error");
    expect(result.current.syncError).toBe("boom");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("debounces saves into one upsert with the latest value", async () => {
    mocks.auth.user = user;
    const { result } = renderHook(() => useSyncedProgress());
    await flush();
    mocks.upsert.mockClear();

    act(() => result.current.setProgress(withXp(1)));
    await advance(1000);
    act(() => result.current.setProgress(withXp(2)));
    expect(result.current.syncState).toBe("saving");
    await advance(1999);
    expect(mocks.upsert).not.toHaveBeenCalled();
    await advance(1);

    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.upsert.mock.calls[0][0]).toMatchObject({ user_id: "user-1", data: withXp(2) });
    expect(result.current.syncState).toBe("saved");
  });

  it("resetAllProgress cancels a queued save", async () => {
    mocks.auth.user = user;
    const { result } = renderHook(() => useSyncedProgress());
    await flush();
    mocks.upsert.mockClear();

    act(() => result.current.setProgress(withXp(99)));
    await act(async () => {
      await result.current.resetAllProgress();
    });
    await advance(5000);

    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.upsert.mock.calls[0][0]).toMatchObject({ user_id: "user-1", data: defaultProgress });
    expect(result.current.progress).toEqual(defaultProgress);
    expect(result.current.syncState).toBe("saved");
  });
});
