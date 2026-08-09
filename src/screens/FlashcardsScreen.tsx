import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import FlashcardDeck, { type FlashcardItem } from "../components/FlashcardDeck";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import { parseFlashcardsRoute } from "../navigation/routes";
import { useAppBack } from "../navigation/useAppBack";
import { useGame } from "../state/GameProvider";

export default function FlashcardsScreen() {
  const goBack = useAppBack("/review");
  const location = useLocation();
  const { countries } = useGame();
  const route = useMemo(() => parseFlashcardsRoute(location.search, location.state), [location.search, location.state]);
  const routeCodesKey = route?.countryCodes.join(",") ?? "";
  const studyCountries = useMemo(
    () =>
      routeCodesKey
        ? routeCodesKey
            .split(",")
            .map((code) => countries.find((country) => country.code === code))
            .filter((country): country is (typeof countries)[number] => Boolean(country))
        : [],
    [countries, routeCodesKey]
  );
  const cards = useMemo<FlashcardItem[]>(
    () =>
      studyCountries.map((country) => ({
        id: country.code,
        promptLabel: "Country flag",
        answerLabel: country.name,
        prompt: (
          <span className="flex h-full flex-col p-5">
            <span className="text-center text-sm font-bold uppercase tracking-[0.18em] text-muted">Which country?</span>
            <span className="flex min-h-0 flex-1 items-center justify-center py-6">
              <FlagImage
                code={country.code}
                name="Flag to identify"
                src={country.flagUrl}
                fit="natural"
                framed={false}
                className="w-full"
                imgClassName="max-h-56 shadow-card"
              />
            </span>
            <span className="text-center font-display text-base font-semibold text-primary">
              Tap the card to reveal
            </span>
          </span>
        ),
        answer: (
          <span className="flex h-full flex-col items-center justify-center p-7 text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Answer</span>
            <span className="mt-5 font-display text-[clamp(2.5rem,10vw,4rem)] font-semibold leading-[1.05]">{country.name}</span>
            <span className="mt-4 text-lg font-semibold text-white/75">
              {country.subregion || country.continent}
            </span>
            <span className="mt-12 rounded-full bg-white/15 px-5 py-2.5 font-display text-sm font-semibold text-white/85">
              Tap to see the flag
            </span>
          </span>
        )
      })),
    [studyCountries]
  );

  if (!route || !cards.length) return <Navigate to="/review" replace />;

  return (
    <main className="flex min-h-full flex-col overflow-x-hidden bg-paper px-5 pb-8 pt-4">
      <header className="flex items-center gap-3">
        <button type="button" onClick={goBack} aria-label="Close flashcards" className="icon-btn">
          <Icon name="close" size={19} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold leading-tight text-ink">Missed flags</h1>
          <p className="text-xs font-bold text-muted">Flip each card, then swipe through the deck.</p>
        </div>
      </header>

      <FlashcardDeck cards={cards} className="mt-7 flex-1" />
    </main>
  );
}
