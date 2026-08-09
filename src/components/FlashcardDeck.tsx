import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Icon from "./Icon";

export type FlashcardItem = {
  id: string;
  prompt: ReactNode;
  answer: ReactNode;
  promptLabel: string;
  answerLabel: string;
};

type Props = {
  cards: FlashcardItem[];
  className?: string;
  onCardChange?: (index: number, card: FlashcardItem) => void;
};

const SWIPE_THRESHOLD = 64;
const MAX_DRAG = 140;
const OFFSCREEN_DISTANCE = 560;
const EXIT_DURATION = 220;
const ENTER_DURATION = 260;

export default function FlashcardDeck({ cards, className = "", onCardChange }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [cardOpacity, setCardOpacity] = useState(1);
  const pointerStart = useRef<number | null>(null);
  const moved = useRef(false);
  const suppressClick = useRef(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const animationTimers = useRef<number[]>([]);
  const current = cards[index];

  useEffect(() => {
    setIndex((value) => Math.min(value, Math.max(cards.length - 1, 0)));
    setFlipped(false);
    setDragX(0);
  }, [cards.length]);

  useEffect(() => () => {
    animationTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const goTo = useCallback((nextIndex: number) => {
    if (!cards.length || animating) return;
    const bounded = Math.min(Math.max(nextIndex, 0), cards.length - 1);
    if (bounded === index) {
      setDragX(0);
      return;
    }

    const direction = bounded > index ? 1 : -1;
    const exitDistance = Math.max(
      OFFSCREEN_DISTANCE,
      (cardRef.current?.getBoundingClientRect().width ?? 0) + 96
    );
    setAnimating(true);
    setDragging(false);
    setMotionEnabled(true);
    setDragX(direction * -exitDistance);
    setCardOpacity(0);

    const swapTimer = window.setTimeout(() => {
      setMotionEnabled(false);
      setIndex(bounded);
      setFlipped(false);
      setDragX(direction * exitDistance);
      onCardChange?.(bounded, cards[bounded]);

      const enterTimer = window.setTimeout(() => {
        setMotionEnabled(true);
        setDragX(0);
        setCardOpacity(1);

        const finishTimer = window.setTimeout(() => {
          setAnimating(false);
        }, ENTER_DURATION);
        animationTimers.current.push(finishTimer);
      }, 20);
      animationTimers.current.push(enterTimer);
    }, EXIT_DURATION);
    animationTimers.current.push(swapTimer);
  }, [animating, cards, index, onCardChange]);

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (animating) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStart.current = event.clientX;
    moved.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (pointerStart.current === null || animating) return;
    const distance = event.clientX - pointerStart.current;
    if (Math.abs(distance) > 8) moved.current = true;
    setDragX(Math.max(-MAX_DRAG, Math.min(MAX_DRAG, distance)));
  }

  function finishPointer(event: ReactPointerEvent<HTMLButtonElement>) {
    if (pointerStart.current === null || animating) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    setDragging(false);

    if (moved.current) {
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }

    if (distance <= -SWIPE_THRESHOLD) goTo(index + 1);
    else if (distance >= SWIPE_THRESHOLD) goTo(index - 1);
    else setDragX(0);
  }

  function cancelPointer() {
    pointerStart.current = null;
    moved.current = false;
    setDragging(false);
    setDragX(0);
  }

  if (!current) {
    return (
      <div className={`rounded-[24px] border border-line bg-paper p-6 text-center font-semibold text-muted shadow-card ${className}`}>
        No flashcards available.
      </div>
    );
  }

  return (
    <section className={`flex min-h-0 flex-col ${className}`} aria-label="Flashcards">
      <div className="mb-3 flex items-center justify-between">
        <span className="section-label">Study deck</span>
        <span className="font-display text-sm font-semibold text-muted" role="status" aria-live="polite">
          {index + 1} of {cards.length}
        </span>
      </div>

      <div className="relative mx-auto min-h-[360px] w-full flex-1 [perspective:1200px]">
        <button
          ref={cardRef}
          type="button"
          aria-label={flipped ? `${current.answerLabel}. Tap to show the flag again.` : `${current.promptLabel}. Tap to reveal the answer.`}
          aria-pressed={flipped}
          onClick={() => {
            if (suppressClick.current || animating) return;
            setFlipped((value) => !value);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goTo(index - 1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              goTo(index + 1);
            }
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={cancelPointer}
          onDragStart={(event) => event.preventDefault()}
          className="absolute inset-0 block h-full w-full touch-pan-y select-none rounded-[28px] text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/35"
          style={{
            opacity: dragging ? Math.max(0.72, 1 - Math.abs(dragX) / 500) : cardOpacity,
            transform: `translateX(${dragX}px)`,
            transition: dragging || !motionEnabled
              ? "none"
              : `transform ${animating ? (cardOpacity === 0 ? EXIT_DURATION : ENTER_DURATION) : 220}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${animating ? EXIT_DURATION : 180}ms ease`
          }}
        >
          <span
            className="relative block h-full w-full motion-reduce:transition-none"
            style={{
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transformStyle: "preserve-3d",
              transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)"
            }}
          >
            <span
              aria-hidden={flipped}
              className="absolute inset-0 block overflow-hidden rounded-[28px] border-2 border-line bg-paper shadow-card-lg"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              {current.prompt}
            </span>
            <span
              aria-hidden={!flipped}
              className="absolute inset-0 block overflow-hidden rounded-[28px] border-2 border-primary bg-primary text-white shadow-card-lg"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              {current.answer}
            </span>
          </span>
        </button>
      </div>

      <div className="mt-auto flex items-center justify-center gap-4 pt-6">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0 || animating}
          aria-label="Previous flashcard"
          className="icon-btn h-12 w-12 text-primary disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Icon name="chevron" size={18} className="rotate-180" />
        </button>
        <div className="flex max-w-[180px] items-center justify-center gap-1.5" aria-hidden="true">
          {cards.map((card, cardIndex) => (
            <span
              key={card.id}
              className={`h-2 rounded-full transition-all ${cardIndex === index ? "w-6 bg-accent" : "w-2 bg-line"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === cards.length - 1 || animating}
          aria-label="Next flashcard"
          className="icon-btn h-12 w-12 text-primary disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Icon name="chevron" size={18} />
        </button>
      </div>

      <p className="mt-3 text-center text-xs font-bold text-muted">
        Tap to flip · Swipe left or right
      </p>
    </section>
  );
}
