import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { countries } from "@flaggo/core/data/countries";
import { defaultProgress } from "@flaggo/core/types/progress";
import ReviewScreen from "../ReviewScreen";

const startReview = vi.fn();
const startMapReview = vi.fn();
let progress = defaultProgress;

vi.mock("../../state/GameProvider", () => ({
  useGame: () => ({ countries, progress, startReview, startMapReview })
}));

function renderScreen() {
  return render(
    <MemoryRouter>
      <ReviewScreen />
    </MemoryRouter>
  );
}

describe("ReviewScreen other topics", () => {
  beforeEach(() => {
    startReview.mockClear();
    progress = defaultProgress;
  });

  it("shows a capital card for due capitals and starts a capital review on click", () => {
    progress = {
      ...defaultProgress,
      review: {
        "FR:capital": {
          countryCode: "FR",
          topic: "capital",
          box: 0,
          correctCount: 0,
          wrongCount: 1,
          lastSeenAt: null,
          nextReviewAt: new Date(Date.now() - 1000).toISOString()
        }
      }
    };
    renderScreen();
    fireEvent.click(screen.getByText("1 capital due"));
    expect(startReview).toHaveBeenCalledTimes(1);
    expect(startReview.mock.calls[0][1]).toBe("capital");
    expect(startReview.mock.calls[0][0].map((c: { code: string }) => c.code)).toEqual(["FR"]);
  });

  it("hides the section when no other topic has anything", () => {
    renderScreen();
    expect(screen.queryByText("Other topics")).toBeNull();
  });
});
