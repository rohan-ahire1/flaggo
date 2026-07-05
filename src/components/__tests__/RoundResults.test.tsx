import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RoundResults from "../RoundResults";

describe("RoundResults", () => {
  it("renders review items and fires actions", () => {
    const again = vi.fn();
    render(
      <RoundResults
        score={1}
        total={2}
        items={[
          { label: "France", correct: true, answer: "France" },
          { label: "Brazil", correct: false, chosen: "Argentina", answer: "Brazil" }
        ]}
        actions={[{ label: "Play again", variant: "primary", onPress: again }]}
      />
    );

    expect(screen.getByText("Round complete")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
    expect(screen.getByText("Brazil")).toBeInTheDocument();
    expect(screen.getByText(/You: Argentina/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Play again/ }));
    expect(again).toHaveBeenCalledTimes(1);
  });
});
