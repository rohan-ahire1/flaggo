import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { countries } from "@flaggo/core/data/countries";
import FeedbackPanel from "../FeedbackPanel";

vi.mock("../../lib/sfx", () => ({
  playCorrect: vi.fn(),
  playWrong: vi.fn()
}));

describe("FeedbackPanel", () => {
  it("clearly reveals the correct flag after a wrong flag choice", () => {
    const anguilla = countries.find((country) => country.code === "AI")!;

    render(
      <FeedbackPanel
        correct={false}
        country={anguilla}
        xp={0}
        selectedLabel="Lesotho"
        revealCorrectFlag
        onContinue={vi.fn()}
      />
    );

    expect(screen.getByText(/Correct flag:/)).toHaveTextContent("Correct flag: Anguilla");
    expect(screen.queryByText(/Your answer:/)).not.toBeInTheDocument();
    expect(screen.getByAltText("Anguilla")).toBeInTheDocument();
  });

  it("separates a wrong answer from the correction", () => {
    const japan = countries.find((country) => country.code === "JP")!;

    render(
      <FeedbackPanel
        correct={false}
        country={japan}
        xp={0}
        answerLabel="Tokyo"
        answerDetail="The capital of Japan is Tokyo."
        selectedLabel="Kyoto"
        onContinue={vi.fn()}
      />
    );

    expect(screen.getByText(/The correct answer is/)).toHaveTextContent("The correct answer is Tokyo.");
    expect(screen.queryByText(/Your answer:/)).not.toBeInTheDocument();
    expect(screen.getByText("The capital of Japan is Tokyo.")).toBeInTheDocument();
  });
});
