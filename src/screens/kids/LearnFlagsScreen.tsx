import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import FlagImage from "../../components/FlagImage";
import Globe from "../../components/kids/Globe";
import { useKidsProgress } from "../../hooks/useKidsProgress";
import { useAppBack } from "../../navigation/useAppBack";
import { useGame } from "../../state/GameProvider";
import { getRegion, regionCountries } from "../../utils/kidsContinents";
import { cancelSpeech, speak } from "../../utils/speak";

// A gentle flashcard walkthrough: one big flag at a time, the globe says its
// name aloud (pre-readers), tap Next. Seeing a flag here collects its sticker,
// so learning always makes progress even before the games.
export default function LearnFlagsScreen() {
  const navigate = useNavigate();
  const { region: key } = useParams();
  const { countries } = useGame();
  const { collect } = useKidsProgress();
  const region = getRegion(key);
  const goBack = useAppBack(region ? `/kids/region/${region.key}` : "/kids");
  const flags = useMemo(() => (region ? regionCountries(region, countries) : []), [region, countries]);
  const [index, setIndex] = useState(0);

  useEffect(() => cancelSpeech, []);
  useEffect(() => {
    const current = flags[index];
    if (!current) return;
    speak(current.name);
    collect(current.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!region || !flags.length) {
    return <Navigate to="/kids" replace />;
  }

  const current = flags[index];
  const last = index === flags.length - 1;

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-[#eaf6ff] to-[#dceffb] font-nunito text-kid-ink">
      {/* header */}
      <div className="flex items-center justify-between px-[18px] pb-2 pt-5">
        <button
          onClick={goBack}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl leading-none text-kid-ink shadow-[0_4px_0_rgba(43,58,85,.14)] active:translate-y-0.5 active:shadow-none"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          {flags.map((_, i) => (
            <span key={i} className={`h-2.5 rounded-full ${i === index ? "w-[22px] bg-kid-blue" : "w-2.5"}`} style={i === index ? undefined : { background: "#c7d7e6" }} />
          ))}
        </div>
        <button
          onClick={goBack}
          aria-label="Close"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg leading-none text-kid-slate shadow-[0_4px_0_rgba(43,58,85,.14)] active:translate-y-0.5 active:shadow-none"
        >
          ✕
        </button>
      </div>

      {/* card */}
      <div className="flex flex-1 flex-col items-center justify-center px-[26px]">
        <div className="w-full animate-pop-in rounded-[32px] bg-white p-[22px] text-center shadow-[0_14px_30px_rgba(43,58,85,.14)]" key={current.code}>
          <FlagImage
            code={current.code}
            name={current.name}
            src={current.flagUrl}
            framed={false}
            fit="contain"
            className="mb-[18px] aspect-[3/2] w-full rounded-[20px] bg-[#eef2f7] p-2"
          />
          <div className="font-baloo text-4xl font-extrabold leading-none text-kid-ink">{current.name}</div>
          <div className="mt-1 font-nunito text-base font-bold text-kid-slate">{region.label}</div>
          <button
            onClick={() => speak(current.name)}
            className="mt-[18px] inline-flex items-center gap-2.5 rounded-full bg-kid-blue px-6 py-3.5 font-baloo text-lg font-bold text-white shadow-[0_6px_0_#1f89ba] active:translate-y-1 active:shadow-none"
          >
            🔊 Say it again
          </button>
        </div>
      </div>

      {/* footer */}
      <div className="flex items-end gap-3 px-6 pb-8 pt-2">
        {index > 0 && (
          <button
            onClick={() => setIndex((i) => i - 1)}
            className="rounded-3xl bg-white px-5 py-5 font-baloo text-xl font-extrabold text-kid-slate shadow-[0_7px_0_#dfe6f0] active:translate-y-1 active:shadow-none"
          >
            ‹
          </button>
        )}
        <div className="h-[70px] w-[70px] flex-none">
          <Globe mood="happy" size={70} bob />
        </div>
        <button
          onClick={() => (last ? navigate(`/kids/find/${region.key}`, { replace: true }) : setIndex((i) => i + 1))}
          className="flex-1 rounded-3xl bg-kid-green py-5 font-baloo text-[22px] font-extrabold text-white shadow-[0_7px_0_#23a457] active:translate-y-1 active:shadow-none"
        >
          {last ? "Play a game! 🎮" : "Next →"}
        </button>
      </div>
    </div>
  );
}
