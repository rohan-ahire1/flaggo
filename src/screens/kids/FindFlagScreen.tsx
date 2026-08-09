import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { Country } from "@flaggo/core/types/country";
import KidFlag from "../../components/kids/KidFlag";
import Globe, { type GlobeMood } from "../../components/kids/Globe";
import { useKidsProgress } from "../../hooks/useKidsProgress";
import { useAppBack } from "../../navigation/useAppBack";
import { useGame } from "../../state/GameProvider";
import { getRegion, regionCountries } from "../../utils/kidsContinents";
import { regionAccent } from "../../utils/kidsTheme";
import { pick, shuffle } from "../../utils/kidsFlags";
import { cancelSpeech, speak } from "../../utils/speak";

type Round = { target: Country; choices: Country[] };

const CHEERS = ["Yay!", "You got it!", "Great job!", "Wonderful!", "Woohoo!"];
const CONFETTI = ["#ff6b6b", "#ffc93c", "#2ec16b", "#7c6cf0", "#2ca8e0", "#ff8a5b"];

function makeRound(pool: Country[]): Round {
  const choiceCount = Math.min(3, pool.length);
  const chosen = pick(pool, choiceCount);
  const target = chosen[0];
  return { target, choices: shuffle(chosen) };
}

export default function FindFlagScreen() {
  const { region: key } = useParams();
  const { countries } = useGame();
  const { kids, collect } = useKidsProgress();
  const region = getRegion(key);
  const goBack = useAppBack(region ? `/kids/region/${region.key}` : "/kids");
  const pool = useMemo(() => (region ? regionCountries(region, countries) : []), [region, countries]);
  const [round, setRound] = useState<Round | null>(() => (pool.length ? makeRound(pool) : null));
  const [wrongCode, setWrongCode] = useState<string | null>(null);
  const [mood, setMood] = useState<GlobeMood>("idle");
  const [celebrating, setCelebrating] = useState(false);
  const advanceTimer = useRef<number>();

  const ask = useCallback((r: Round) => {
    setMood("idle");
    speak(`Find ${r.target.name}`);
  }, []);

  useEffect(() => {
    if (round) ask(round);
    return () => {
      cancelSpeech();
      window.clearTimeout(advanceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!region || !round) {
    return <Navigate to="/kids" replace />;
  }

  const accent = regionAccent(region.key);

  const next = () => {
    window.clearTimeout(advanceTimer.current);
    const r = makeRound(pool);
    setRound(r);
    setWrongCode(null);
    setCelebrating(false);
    ask(r);
  };

  const onPick = (country: Country) => {
    if (celebrating) return;
    if (country.code === round.target.code) {
      setCelebrating(true);
      setMood("cheer");
      collect(country.code);
      speak(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
      advanceTimer.current = window.setTimeout(next, 2200);
    } else {
      setWrongCode(country.code);
      setMood("think");
      speak("Try again!");
      window.setTimeout(() => setWrongCode(null), 500);
    }
  };

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-gradient-to-b from-[#fff4ec] to-[#ffe9dc] font-nunito text-kid-ink">
      {/* confetti */}
      {celebrating && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-[-30px] block h-3 w-2.5 animate-kid-fall"
              style={{
                left: `${6 + i * 8}%`,
                background: CONFETTI[i % CONFETTI.length],
                borderRadius: i % 2 ? "50%" : "2px",
                animationDelay: `${(i % 5) * 0.15}s`,
                animationDuration: `${2.2 + (i % 4) * 0.2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* header */}
      <div className="relative z-[21] flex items-center justify-between px-[18px] pb-1.5 pt-5">
        <button
          onClick={goBack}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl leading-none text-kid-ink shadow-[0_4px_0_rgba(43,58,85,.14)] active:translate-y-0.5 active:shadow-none"
        >
          ‹
        </button>
        <span className="font-baloo text-xl font-extrabold text-kid-ink">Find the Flag</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[15px] font-extrabold text-kid-gold shadow-[0_4px_0_rgba(43,58,85,.12)]">
          ⭐ <span className="text-kid-ink">{kids.collected.length}</span>
        </span>
      </div>

      {/* prompt */}
      <div className="relative z-[21] flex items-center gap-3 px-[22px] pb-1 pt-2">
        <div className="h-16 w-16 flex-none">
          <Globe mood={mood} size={64} bob />
        </div>
        <button onClick={() => speak(`Find ${round.target.name}`)} className="relative flex-1 rounded-[20px] bg-white px-[18px] py-3.5 text-left shadow-[0_6px_0_rgba(43,58,85,.14)]">
          <div className="font-baloo text-xl font-extrabold text-kid-ink">
            {celebrating ? (
              <>Great job! You found <span style={{ color: accent.hex }}>{round.target.name}</span>! 🎉</>
            ) : (
              <>Find <span style={{ color: accent.hex }}>{round.target.name}</span></>
            )}
          </div>
          <div className="absolute -left-1.5 top-6 h-4 w-4 rotate-45 bg-white" />
        </button>
      </div>

      {/* options */}
      <div className="relative z-[21] flex flex-1 flex-col justify-center gap-4 px-[22px] py-4">
        {round.choices.map((c) => {
          const isTarget = c.code === round.target.code;
          const dim = celebrating && !isTarget;
          return (
            <button
              key={c.code}
              onClick={() => onPick(c)}
              className={`relative block w-full rounded-[26px] bg-white p-3.5 transition active:translate-y-1 ${wrongCode === c.code ? "animate-kid-wiggle" : ""} ${dim ? "opacity-50" : ""}`}
              style={
                celebrating && isTarget
                  ? { boxShadow: "0 8px 0 rgba(46,193,107,.9), 0 0 0 4px #2ec16b" }
                  : { boxShadow: "0 6px 0 rgba(43,58,85,.12)" }
              }
            >
              <KidFlag country={c} className="!bg-[#eef2f7]" />
              {celebrating && isTarget && (
                <span className="absolute -right-3 -top-3.5 grid h-[52px] w-[52px] animate-pop-in place-items-center rounded-full bg-kid-green text-3xl font-black text-white shadow-[0_4px_0_#23a457,0_0_0_5px_#fff]">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* next */}
      {celebrating && (
        <div className="relative z-[21] px-[22px] pb-8">
          <button
            onClick={next}
            className="w-full animate-kid-pulse rounded-3xl bg-kid-green py-5 font-baloo text-[22px] font-extrabold text-white shadow-[0_7px_0_#23a457] active:translate-y-1 active:shadow-none"
          >
            Next flag →
          </button>
        </div>
      )}
    </div>
  );
}
