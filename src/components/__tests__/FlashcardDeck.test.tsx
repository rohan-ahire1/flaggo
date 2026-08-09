import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FlashcardDeck, { type FlashcardItem } from "../FlashcardDeck";

const cards: FlashcardItem[] = [
  {
    id: "FR",
    prompt: <span>French flag</span>,
    answer: <span>France</span>,
    promptLabel: "Country flag",
    answerLabel: "France"
  },
  {
    id: "BR",
    prompt: <span>Brazilian flag</span>,
    answer: <span>Brazil</span>,
    promptLabel: "Country flag",
    answerLabel: "Brazil"
  }
];

describe("FlashcardDeck", () => {
  it("flips a card to reveal its answer", () => {
    render(<FlashcardDeck cards={cards} />);
    const card = screen.getByRole("button", { name: /Country flag/ });

    expect(card).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(card);

    expect(screen.getByRole("button", { name: /France/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("moves between cards with controls and resets the flipped side", () => {
    vi.useFakeTimers();
    const onCardChange = vi.fn();
    render(<FlashcardDeck cards={cards} onCardChange={onCardChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Country flag/ }));
    fireEvent.click(screen.getByRole("button", { name: "Next flashcard" }));
    act(() => vi.advanceTimersByTime(500));

    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Country flag/ })).toHaveAttribute("aria-pressed", "false");
    expect(onCardChange).toHaveBeenCalledWith(1, cards[1]);
    vi.useRealTimers();
  });

  it("supports left and right swipe gestures", () => {
    vi.useFakeTimers();
    render(<FlashcardDeck cards={cards} />);
    const card = screen.getByRole("button", { name: /Country flag/ });

    fireEvent.pointerDown(card, { pointerId: 1, pointerType: "touch", clientX: 180 });
    fireEvent.pointerMove(card, { pointerId: 1, pointerType: "touch", clientX: 80 });
    fireEvent.pointerUp(card, { pointerId: 1, pointerType: "touch", clientX: 80 });
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();

    const secondCard = screen.getByRole("button", { name: /Country flag/ });
    fireEvent.pointerDown(secondCard, { pointerId: 2, pointerType: "touch", clientX: 80 });
    fireEvent.pointerMove(secondCard, { pointerId: 2, pointerType: "touch", clientX: 180 });
    fireEvent.pointerUp(secondCard, { pointerId: 2, pointerType: "touch", clientX: 180 });
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
