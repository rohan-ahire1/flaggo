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

    expect(screen.getByText(/You picked/)).toHaveTextContent("You picked Lesotho");
    expect(screen.getByText(/Correct flag/)).toHaveTextContent("Correct flag Anguilla");
    expect(screen.getByAltText("Anguilla")).toBeInTheDocument();
    expect(screen.queryByText(/Correct answer/)).not.toBeInTheDocument();
  });
});
