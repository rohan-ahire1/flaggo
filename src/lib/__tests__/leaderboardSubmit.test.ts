import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const upsert = vi.fn();

vi.mock("../supabase", () => ({
  supabase: {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
    from: vi.fn((table: string) => {
      if (table === "leaderboard_scores") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ maybeSingle }))
            }))
          })),
          upsert
        };
      }
      return {};
    })
  }
}));

vi.mock("../analytics", () => ({ trackEvent: vi.fn() }));

describe("submitScore", () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    upsert.mockReset();
  });

  it("skips writes when the stored score is higher or equal", async () => {
    const { submitScore } = await import("../leaderboard");
    maybeSingle.mockResolvedValueOnce({ data: { score: 10 }, error: null });

    await submitScore("daily-2026-06-18", 8, "Rohan");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("upserts when the new score exceeds the stored score", async () => {
    const { submitScore } = await import("../leaderboard");
    maybeSingle.mockResolvedValueOnce({ data: { score: 4 }, error: null });
    upsert.mockResolvedValueOnce({ error: null });

    await submitScore("daily-2026-06-18", 8, "Rohan");

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", board: "daily-2026-06-18", score: 8, display_name: "Rohan" }),
      { onConflict: "user_id,board" }
    );
  });
});
