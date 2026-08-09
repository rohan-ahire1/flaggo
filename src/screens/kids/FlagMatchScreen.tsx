import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { Country } from "@flaggo/core/types/country";
import KidFlag from "../../components/kids/KidFlag";
import Globe, { type GlobeMood } from "../../components/kids/Globe";
import { useKidsProgress } from "../../hooks/useKidsProgress";
import { useAppBack } from "../../navigation/useAppBack";
import { useGame } from "../../state/GameProvider";
import { getRegion, regionCountries } from "../../utils/kidsContinents";
import { pick, shuffle } from "../../utils/kidsFlags";
import { cancelSpeech, speak } from "../../utils/speak";

type Card = { id: number; country: Country };

function buildDeck(pool: Country[]): Card[] {
  const pairs = Math.min(4, pool.length);
  const chosen = pick(pool, pairs);
  const doubled = chosen.flatMap((country) => [country, country]);
  return shuffle(doubled).map((country, id) => ({ id, country }));
}

export default function FlagMatchScreen() {
  const { region: key } = useParams();
  const { countries } = useGame();
  const { collect } = useKidsProgress();
  const region = getRegion(key);
  const goBack = useAppBack(region ? `/kids/region/${region.key}` : "/kids");
  const pool = useMemo(() => (region ? regionCountries(region, countries) : []), [region, countries]);
  const pairCount = Math.min(4, pool.length);
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(pool));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mood, setMood] = useState<GlobeMood>("idle");
  const [busy, setBusy] = useState(false);

  const won = pairCount > 0 && matched.size === pairCount;

  useEffect(() => cancelSpeech, []);
  useEffect(() => {
    if (won) {
      setMood("cheer");
      speak("You matched them all! Amazing!");
    }
  }, [won]);

  if (!region) {
    return <Navigate to="/kids" replace />;
  }

  const reset = () => {
    setDeck(buildDeck(pool));
    setFlipped([]);
    setMatched(new Set());
    setMood("idle");
    setBusy(false);
  };

  const onFlip = (index: number) => {
    if (busy || flipped.includes(index)) return;
    const card = deck[index];
    if (matched.has(card.country.code)) return;

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);
    if (nextFlipped.length < 2) return;

    setBusy(true);
    const [a, b] = nextFlipped;
    if (deck[a].country.code === deck[b].country.code) {
      const code = deck[a].country.code;
      collect(code);
      setMood("cheer");
      speak(deck[a].country.name);
      window.setTimeout(() => {
        setMatched((prev) => new Set(prev).add(code));
        setFlipped([]);
        setMood("idle");
        setBusy(false);
      }, 700);
    } else {
      setMood("think");
      window.setTimeout(() => {
        setFlipped([]);
        setMood("idle");
        setBusy(false);
      }, 900);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-[#efe9ff] to-[#e4dcfb] font-nunito text-kid-ink">
      {/* header */}
      <div className="flex items-center justify-between px-[18px] pb-1.5 pt-5">
        <button
          onClick={goBack}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl leading-none text-kid-ink shadow-[0_4px_0_rgba(43,58,85,.14)] active:translate-y-0.5 active:shadow-none"
        >
          ‹
        </button>
        <span className="font-baloo text-xl font-extrabold text-kid-ink">Flag Match</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-kid-purple px-3.5 py-2 text-sm font-extrabold text-white shadow-[0_4px_0_#5f50cf]">
          🧩 {matched.size}/{pairCount || 0}
        </span>
      </div>

      <div className="px-5 pb-0.5 pt-1.5 text-center font-baloo text-[17px] font-bold text-[#6a5fc0]">
        {won ? "You did it! 🎉" : "Find the matching pairs!"}
      </div>

      {/* board */}
      <div className="grid flex-1 grid-cols-2 content-center gap-3 px-[22px] py-2.5">
        {deck.map((card, index) => {
          const isMatched = matched.has(card.country.code);
          const isUp = flipped.includes(index) || isMatched;
          if (isUp) {
            const ringGreen = isMatched;
            return (
              <div
                key={card.id}
                className="flex flex-col items-center justify-center gap-1.5 rounded-[22px] bg-white p-2.5 animate-pop-in"
                style={{
                  boxShadow: ringGreen
                    ? "0 6px 0 rgba(46,193,107,.9), 0 0 0 4px #2ec16b"
                    : "0 6px 0 rgba(255,201,60,.9), 0 0 0 4px #ffc93c"
                }}
              >
                <KidFlag country={card.country} className="!rounded-[12px] !p-0" />
                <span className="font-baloo text-sm font-bold" style={{ color: ringGreen ? "#2ec16b" : "#e0a91f" }}>
                  {card.country.name}
                  {ringGreen ? " ✓" : ""}
                </span>
              </div>
            );
          }
          return (
            <button
              key={card.id}
              onClick={() => onFlip(index)}
              className="grid place-items-center rounded-[22px] bg-gradient-to-b from-[#8878f2] to-[#6a5ad6] py-6 shadow-[0_6px_0_#5346b8] active:translate-y-1 active:shadow-none"
            >
              <div className="h-14 w-14">
                <Globe mood="idle" size={56} />
              </div>
            </button>
          );
        })}
      </div>

      {/* footer */}
      <div className="flex items-center gap-2.5 px-6 pb-6 pt-1">
        <div className="h-[50px] w-[50px] flex-none">
          <Globe mood={mood} size={50} bob />
        </div>
        <span className="font-baloo text-base font-bold text-[#6a5fc0]">
          {won ? "You matched them all! 🎊" : "Tap two cards to find a pair"}
        </span>
      </div>

      {won && (
        <div className="px-6 pb-8">
          <button
            onClick={reset}
            className="w-full rounded-3xl bg-kid-green py-5 font-baloo text-[22px] font-extrabold text-white shadow-[0_7px_0_#23a457] active:translate-y-1 active:shadow-none"
          >
            Play again ⭐
          </button>
        </div>
      )}
    </div>
  );
}
