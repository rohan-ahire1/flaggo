import { describe, expect, it } from "vitest";
import { arcadeBoard, dailyBoard, sanitizeDisplayName, xpBoard } from "../leaderboard";

describe("leaderboard helpers", () => {
  it("formats board ids and handles", () => {
    expect(dailyBoard("2026-06-18")).toBe("daily-2026-06-18");
    expect(arcadeBoard("timed", "flag")).toBe("arcade-timed-flag");
    expect(xpBoard()).toBe("xp-alltime");
    expect(sanitizeDisplayName("  Ro\u0000han Long Name That Gets Trimmed  ")).toBe("Rohan Long Name That Get");
  });
});
