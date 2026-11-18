import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { countries } from "@flaggo/core/data/countries";
import type { Question } from "@flaggo/core/utils/quiz";
import QuestionCard from "../QuestionCard";

const france = countries.find((country) => country.code === "FR")!;
const options = [france, ...countries.filter((country) => country.code !== "FR").slice(0, 3)];

function renderCard(question: Question, disabled: boolean) {
  return render(<QuestionCard question={question} disabled={disabled} onAnswer={vi.fn()} />);
}

describe("QuestionCard flag hiding", () => {
  const guess: Question = { id: "q1", type: "guess-country", correctCountry: france, options };

  it("does not reveal the answer in alt text or the load-failure fallback while unanswered", () => {
    renderCard(guess, false);
    for (const img of screen.getAllByRole("img")) expect(img.getAttribute("alt")).not.toMatch(/France/);
    const prompt = screen.getByAltText("Flag to identify");
    fireEvent.error(prompt);
    expect(screen.queryByText("FR")).not.toBeInTheDocument();
    expect(screen.getByText("Flag unavailable")).toBeInTheDocument();
  });

  it("uses neutral alts for pick-flag options", () => {
    renderCard({ id: "q2", type: "pick-flag", correctCountry: france, options }, false);
    expect(screen.getAllByRole("img").map((img) => img.getAttribute("alt"))).toEqual(["Option 1", "Option 2", "Option 3", "Option 4"]);
  });

  it("shows the country name again once answered", () => {
    renderCard(guess, true);
    expect(screen.getByAltText("France")).toBeInTheDocument();
  });
});
