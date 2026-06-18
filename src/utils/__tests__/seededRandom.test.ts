import { describe, expect, it } from "vitest";
import { hashStringToSeed, mulberry32, seededPick, seededShuffle } from "../seededRandom";

describe("seededRandom", () => {
  it("is deterministic for a fixed seed", () => {
    const a = mulberry32(hashStringToSeed("same"));
    const b = mulberry32(hashStringToSeed("same"));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(seededShuffle([1, 2, 3, 4], mulberry32(42))).toEqual(seededShuffle([1, 2, 3, 4], mulberry32(42)));
    expect(seededPick([1, 2, 3, 4], 2, mulberry32(42))).toEqual(seededPick([1, 2, 3, 4], 2, mulberry32(42)));
  });

  it("diverges for different seeds", () => {
    expect(seededShuffle([1, 2, 3, 4, 5, 6], mulberry32(1))).not.toEqual(seededShuffle([1, 2, 3, 4, 5, 6], mulberry32(2)));
  });
});
