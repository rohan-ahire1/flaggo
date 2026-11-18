import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProgress } from "@flaggo/core/types/progress";
import {
  clearAnonymousMergeMarker,
  loadProgress,
  loadProgressMeta,
  needsAnonymousMerge,
  resetProgress,
  saveProgress
} from "../storage";

describe("progress storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("round-trips saved progress", () => {
    saveProgress({ ...defaultProgress, xp: 42 });
    expect(loadProgress().xp).toBe(42);
  });

  it("returns defaults for corrupt JSON", () => {
    localStorage.setItem("flaggo-progress", "{not json");
    expect(loadProgress()).toEqual(defaultProgress);
  });

  it("sets the needs-merge marker only when there is progress", () => {
    saveProgress(defaultProgress);
    expect(needsAnonymousMerge()).toBe(false);
    saveProgress({ ...defaultProgress, xp: 10 });
    expect(needsAnonymousMerge()).toBe(true);
    clearAnonymousMergeMarker();
    expect(needsAnonymousMerge()).toBe(false);
  });

  it("resetProgress clears all keys", () => {
    saveProgress({ ...defaultProgress, xp: 10 });
    resetProgress();
    expect(localStorage.getItem("flaggo-progress")).toBeNull();
    expect(localStorage.getItem("flaggo-progress-meta")).toBeNull();
    expect(localStorage.getItem("flaggo-progress-needs-merge")).toBeNull();
  });

  it("ignores non-object stored meta", () => {
    for (const raw of ["null", "5", "[1]"]) {
      localStorage.setItem("flaggo-progress-meta", raw);
      expect(loadProgressMeta()).toEqual({ updatedAt: null, userId: null });
    }
  });

  it("never throws when localStorage is blocked", () => {
    const boom = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(boom);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(boom);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(boom);
    expect(loadProgress()).toEqual(defaultProgress);
    expect(() => saveProgress({ ...defaultProgress, xp: 1 })).not.toThrow();
    expect(() => resetProgress()).not.toThrow();
    expect(needsAnonymousMerge()).toBe(false);
    expect(() => clearAnonymousMergeMarker()).not.toThrow();
    expect(loadProgressMeta()).toEqual({ updatedAt: null, userId: null });
  });
});
