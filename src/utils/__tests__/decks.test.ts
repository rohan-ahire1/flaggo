import { describe, expect, it, vi } from "vitest";
import { defaultProgress } from "../../types/progress";
import { createDeck, buildWeakDeck, toggleStarredDeck, STARRED_DECK_ID } from "../decks";

describe("decks", () => {
  it("builds weak decks by topic and cap", () => {
    const progress = {
      ...defaultProgress,
      review: {
        "FR:flag": { countryCode: "FR", topic: "flag" as const, box: 0, correctCount: 1, wrongCount: 5, lastSeenAt: null, nextReviewAt: "" },
        "DE:flag": { countryCode: "DE", topic: "flag" as const, box: 4, correctCount: 5, wrongCount: 0, lastSeenAt: null, nextReviewAt: "" },
        "IT:capital": { countryCode: "IT", topic: "capital" as const, box: 1, correctCount: 2, wrongCount: 3, lastSeenAt: null, nextReviewAt: "" }
      }
    };
    expect(buildWeakDeck(progress, "flag")).toEqual(["FR"]);
    expect(buildWeakDeck(progress, "capital", 1)).toEqual(["IT"]);
  });

  it("creates decks and toggles starred", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "id-1" });
    expect(createDeck(" Test ", ["FR", "FR"], "flag")).toMatchObject({ id: "id-1", name: "Test", codes: ["FR"], topic: "flag" });
    const added = toggleStarredDeck(defaultProgress, "FR", "flag");
    expect(added.decks.find((deck) => deck.id === STARRED_DECK_ID)?.codes).toEqual(["FR"]);
    const removed = toggleStarredDeck(added, "FR", "flag");
    expect(removed.decks.find((deck) => deck.id === STARRED_DECK_ID)?.codes).toEqual([]);
    vi.unstubAllGlobals();
  });
});
