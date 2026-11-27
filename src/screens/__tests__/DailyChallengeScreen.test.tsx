import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { countries } from "@flaggo/core/data/countries";
import { buildDailyQuiz, dateKey } from "@flaggo/core/utils/dailyChallenge";
import { defaultProgress, type AppProgress } from "@flaggo/core/types/progress";
import DailyChallengeScreen from "../DailyChallengeScreen";

const setProgress = vi.fn();
let progress: AppProgress = defaultProgress;

vi.mock("../../state/GameProvider", () => ({
  useGame: () => ({ countries, progress, setProgress })
}));
vi.mock("../../components/ConfirmDialog", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true)
}));
vi.mock("../../lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../../lib/sfx", () => ({
  playCorrect: vi.fn(),
  playWrong: vi.fn(),
  playComplete: vi.fn()
}));

function renderScreen() {
  return render(
    <MemoryRouter>
      <DailyChallengeScreen />
    </MemoryRouter>
  );
}

describe("DailyChallengeScreen", () => {
  beforeEach(() => {
    setProgress.mockClear();
    progress = defaultProgress;
  });

  it("shows the first question when today has no result", () => {
    renderScreen();
    expect(screen.queryByText("Done for today")).toBeNull();
    expect(screen.getByText("1/5")).toBeTruthy();
  });

  it("shows the saved score when today is already done", () => {
    const today = dateKey();
    progress = {
      ...progress,
      daily: { lastDate: today, streak: 3, best: 3, history: { [today]: { score: 4, total: 5 } } }
    };
    renderScreen();
    expect(screen.getByText("Done for today")).toBeTruthy();
    expect(screen.getByText("4 / 5")).toBeTruthy();
    expect(screen.getByText("Back home")).toBeTruthy();
    expect(screen.getByText("Practice again")).toBeTruthy();
  });

  it("gives no XP when practising again", () => {
    const today = dateKey();
    progress = {
      ...progress,
      xp: 100,
      daily: { lastDate: today, streak: 3, best: 3, history: { [today]: { score: 4, total: 5 } } }
    };
    renderScreen();
    fireEvent.click(screen.getByText("Practice again"));
    expect(screen.getByText(/Practice · no XP/)).toBeTruthy();

    const question = buildDailyQuiz(today, countries)[0].question;
    const label = "options" in question
      ? question.options.find((country) => country.code === question.correctCountry.code)?.name
      : "optionCapitals" in question
        ? question.correctCapital
        : undefined;
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("section button"));
    fireEvent.click((label && buttons.find((button) => button.textContent?.includes(label))) || buttons[0]);

    expect(setProgress).toHaveBeenCalled();
    for (const [next] of setProgress.mock.calls) expect(next.xp).toBe(100);
  });
});
