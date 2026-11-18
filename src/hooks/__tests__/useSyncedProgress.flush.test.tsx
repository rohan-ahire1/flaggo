import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProgress } from "@flaggo/core/types/progress";

const upsert = vi.fn();
const maybeSingle = vi.fn();

vi.mock("../../auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" }, loading: false })
}));

vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: () => ({
      upsert: (...args: unknown[]) => upsert(...args),
      select: () => ({ eq: () => ({ maybeSingle: () => maybeSingle() }) })
    })
  }
}));

import { useSyncedProgress } from "../useSyncedProgress";

const changed = { ...defaultProgress, xp: 42 };

function setVisibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

async function renderHydrated() {
  const hook = renderHook(() => useSyncedProgress());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  upsert.mockClear();
  return hook;
}

describe("useSyncedProgress flush and retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    upsert.mockReset();
    maybeSingle.mockReset();
    upsert.mockResolvedValue({ error: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    setVisibility("visible");
    vi.useRealTimers();
  });

  it("uploads immediately when hidden and the timer does not send again", async () => {
    const { result } = await renderHydrated();
    act(() => result.current.setProgress(changed));
    expect(upsert).not.toHaveBeenCalled();

    await act(async () => {
      setVisibility("hidden");
    });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0].data).toEqual(changed);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(result.current.syncState).toBe("saved");
  });

  it("retries a failed upload when the device comes back online", async () => {
    const { result } = await renderHydrated();
    upsert.mockResolvedValueOnce({ error: { message: "offline" } });
    act(() => result.current.setProgress(changed));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(result.current.syncState).toBe("error");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(upsert).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert.mock.calls[1][0].data).toEqual(changed);
    expect(result.current.syncState).toBe("saved");
  });

  it("does not resend old progress after a reset", async () => {
    const { result } = await renderHydrated();
    upsert.mockResolvedValueOnce({ error: { message: "offline" } });
    act(() => result.current.setProgress(changed));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(result.current.syncState).toBe("error");

    await act(async () => {
      await result.current.resetAllProgress();
    });
    upsert.mockClear();

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    expect(upsert).not.toHaveBeenCalled();
  });
});
