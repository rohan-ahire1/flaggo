import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ParentalGate from "../../components/kids/ParentalGate";
import Globe from "../../components/kids/Globe";
import { useKidsProgress } from "../../hooks/useKidsProgress";
import { useAppBack } from "../../navigation/useAppBack";
import {
  REGIONS,
  type Region,
  type RegionKey,
  isRegionComplete,
  isRegionUnlocked,
  regionCollectedCount
} from "../../utils/kidsContinents";
import { regionAccent, regionArt } from "../../utils/kidsTheme";
import { speak, voiceSupported } from "../../utils/speak";

// The continents are laid out as a journey that descends the board in unlock
// order (Americas → Europe → Africa → Asia → Oceania), zig-zagging side to side
// with even vertical rhythm. A dotted route connects the "stops" so the spacing
// reads as a deliberate path rather than a scattered map.
const LAYOUT: Record<RegionKey, { left: string; top: string; width: string; z: number }> = {
  Americas: { left: "3%", top: "11%", width: "42%", z: 12 },
  Europe: { left: "55%", top: "24%", width: "24%", z: 16 },
  Africa: { left: "6%", top: "42%", width: "34%", z: 11 },
  Asia: { left: "53%", top: "50%", width: "43%", z: 8 },
  Oceania: { left: "33%", top: "70%", width: "40%", z: 10 }
};

// Route drawn through the centre of each stop, in unlock order (viewBox 100×100).
const ROUTE = "M24,26 Q46,28 67,36 Q44,46 23,55 Q50,60 74,64 Q64,76 53,84";

export default function KidsHomeScreen() {
  const navigate = useNavigate();
  const exitKids = useAppBack("/");
  const { kids, toggleVoice } = useKidsProgress();
  const [gate, setGate] = useState<null | "exit" | "voice">(null);

  const handleGatePass = () => {
    if (gate === "exit") exitKids();
    else if (gate === "voice") toggleVoice();
    setGate(null);
  };

  const current = REGIONS.find((r) => isRegionUnlocked(r, kids) && !isRegionComplete(r, kids));

  const onTap = (region: Region) => {
    if (!isRegionUnlocked(region, kids)) {
      speak("Finish the flags before this one first!");
      return;
    }
    speak(region.label);
    navigate(`/kids/region/${region.key}`);
  };

  return (
    <div className="relative h-full min-h-full w-full overflow-hidden bg-gradient-to-b from-[#8fd9f2] via-[#63c6ee] to-[#49b6e6] font-nunito">
      {/* soft ocean dots */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,.35) 0 2px, transparent 3px),radial-gradient(circle at 70% 55%, rgba(255,255,255,.28) 0 2px, transparent 3px),radial-gradient(circle at 45% 80%, rgba(255,255,255,.3) 0 2px, transparent 3px)",
          backgroundSize: "120px 120px,150px 150px,90px 90px"
        }}
      />

      {/* app bar */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => setGate("exit")}
          className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 font-nunito text-[13px] font-extrabold text-kid-ink shadow-[0_4px_0_rgba(43,58,85,.18)] active:translate-y-0.5 active:shadow-none"
        >
          🔒 Grown-ups
        </button>
        <div className="flex gap-2.5">
          <button
            onClick={() => navigate("/kids/stickers")}
            aria-label="Sticker book"
            className="grid h-[46px] w-[46px] place-items-center rounded-full bg-white text-xl shadow-[0_4px_0_rgba(43,58,85,.18)] active:translate-y-0.5 active:shadow-none"
          >
            ⭐
          </button>
          {voiceSupported() && (
            <button
              onClick={() => setGate("voice")}
              aria-label="Toggle voice"
              className="grid h-[46px] w-[46px] place-items-center rounded-full bg-white text-lg shadow-[0_4px_0_rgba(43,58,85,.18)] active:translate-y-0.5 active:shadow-none"
            >
              {kids.voice ? "🔊" : "🔇"}
            </button>
          )}
        </div>
      </div>

      {/* title chip */}
      <div className="absolute left-1/2 top-[76px] z-20 -translate-x-1/2">
        <div className="rounded-full bg-kid-ink/30 px-5 py-1.5 text-center font-baloo text-[19px] font-extrabold text-white backdrop-blur-[2px] [text-shadow:0_1px_3px_rgba(20,60,90,.4)]">
          Pick a place to explore!
        </div>
      </div>

      {/* journey route */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-[4] h-full w-full">
        <path d={ROUTE} fill="none" stroke="#ffffff" strokeWidth="0.7" strokeLinecap="round" strokeDasharray="0.2 3" opacity="0.55" />
      </svg>

      {/* continents */}
      {REGIONS.map((region) => {
        const pos = LAYOUT[region.key];
        const unlocked = isRegionUnlocked(region, kids);
        const done = regionCollectedCount(region, kids);
        const total = region.codes.length;
        const complete = isRegionComplete(region, kids);
        const isCurrent = current?.key === region.key;
        const accent = regionAccent(region.key);

        return (
          <button
            key={region.key}
            onClick={() => onTap(region)}
            className="absolute flex flex-col items-center text-center active:scale-95"
            style={{ left: pos.left, top: pos.top, width: pos.width, zIndex: pos.z }}
          >
            <div
              className={`relative w-full ${isCurrent ? "animate-float rounded-full animate-kid-glow" : ""}`}
              style={{ filter: unlocked ? "drop-shadow(0 8px 8px rgba(20,50,80,.25))" : "grayscale(.7) brightness(.92)", opacity: unlocked ? 1 : 0.78 }}
            >
              <img src={regionArt(region.key)} alt={region.label} className="block w-full" />
            </div>

            {/* compact status pill */}
            {complete ? (
              <span className="-mt-2 inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3 py-1 shadow-[0_4px_0_rgba(43,58,85,.14)]" style={{ borderColor: accent.hex }}>
                <span className="font-baloo text-sm font-extrabold text-kid-ink">{region.label}</span>
                <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-kid-green text-[11px] font-black text-white">✓</span>
              </span>
            ) : unlocked ? (
              <span className="-mt-2 flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-3 py-1 shadow-[0_4px_0_rgba(43,58,85,.14)]" style={{ borderColor: accent.hex }}>
                  <span className="font-baloo text-sm font-extrabold text-kid-ink">{region.label}</span>
                  <span className="text-[11px] font-extrabold" style={{ color: accent.hex }}>{done}/{total}</span>
                </span>
                {isCurrent && (
                  <span className="animate-kid-pulse rounded-full bg-kid-coral px-2.5 py-0.5 font-baloo text-[11px] font-extrabold text-white shadow-[0_3px_0_#e8703f]">
                    PLAY ▸
                  </span>
                )}
              </span>
            ) : (
              <span className="-mt-2 inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 shadow-[0_3px_0_rgba(43,58,85,.12)]">
                <span className="text-[11px]">🔒</span>
                <span className="font-baloo text-sm font-extrabold text-kid-slate">{region.label}</span>
              </span>
            )}
          </button>
        );
      })}

      {/* mascot + speech */}
      <div className="absolute bottom-6 left-4 z-20 flex items-end gap-2.5">
        <Globe mood="happy" size={78} bob />
        {current && (
          <div className="relative mb-3 max-w-[220px] rounded-2xl bg-white px-4 py-3 shadow-[0_6px_0_rgba(43,58,85,.16)]">
            <span className="font-baloo text-[15px] font-bold leading-tight text-kid-ink">
              Let's explore <b style={{ color: regionAccent(current.key).hex }}>{current.label}</b> next! 🎈
            </span>
            <div className="absolute -left-1.5 bottom-4 h-4 w-4 rotate-45 bg-white" />
          </div>
        )}
      </div>

      {gate && <ParentalGate onPass={handleGatePass} onCancel={() => setGate(null)} />}
    </div>
  );
}
