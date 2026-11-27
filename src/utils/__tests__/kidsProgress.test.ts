import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { collectFlag, loadKids, saveKids } from "../kidsProgress";

const KEY = "flaggo-kids";

describe("kidsProgress", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("returns defaults when nothing is stored", () => {
    expect(loadKids()).toEqual({ collected: [], plays: 0, voice: true });
  });

  it("falls back to defaults for bad field values", () => {
    localStorage.setItem(KEY, JSON.stringify({ collected: null, plays: -3, voice: "yes" }));
    expect(loadKids()).toEqual({ collected: [], plays: 0, voice: true });
  });

  it("returns defaults for non-object JSON", () => {
    for (const raw of ["null", "5", "\"x\"", "[1]", "not json"]) {
      localStorage.setItem(KEY, raw);
      expect(loadKids()).toEqual({ collected: [], plays: 0, voice: true });
    }
  });

  it("drops non-strings and duplicates from collected", () => {
    localStorage.setItem(KEY, JSON.stringify({ collected: ["FR", "FR", 5, "JP"] }));
    expect(loadKids().collected).toEqual(["FR", "JP"]);
  });

  it("keeps valid plays and voice", () => {
    localStorage.setItem(KEY, JSON.stringify({ plays: 4, voice: false }));
    expect(loadKids()).toEqual({ collected: [], plays: 4, voice: false });
  });

  it("collectFlag adds a code once, counts every play and saves", () => {
    const a = collectFlag(loadKids(), "FR");
    const b = collectFlag(a, "FR");
    expect(b.collected).toEqual(["FR"]);
    expect(b.plays).toBe(2);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(b);
  });

  it("saveKids does not throw when setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveKids({ collected: [], plays: 0, voice: true })).not.toThrow();
  });

  it("does not share state between loadKids calls", () => {
    const first = loadKids();
    first.collected.push("FR");
    first.plays = 9;
    expect(loadKids()).toEqual({ collected: [], plays: 0, voice: true });
  });
});
