import { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import KidFlag from "../../components/kids/KidFlag";
import { useKidsProgress } from "../../hooks/useKidsProgress";
import { useAppBack } from "../../navigation/useAppBack";
import { useGame } from "../../state/GameProvider";
import { getRegion, regionCollectedCount, regionCountries } from "../../utils/kidsContinents";
import { regionAccent, regionArt } from "../../utils/kidsTheme";
import { speak } from "../../utils/speak";

export default function ContinentScreen() {
  const navigate = useNavigate();
  const goBack = useAppBack("/kids");
  const { region: key } = useParams();
  const { countries } = useGame();
  const { kids } = useKidsProgress();
  const region = getRegion(key);
  const flags = useMemo(() => (region ? regionCountries(region, countries) : []), [region, countries]);

  if (!region) {
    return <Navigate to="/kids" replace />;
  }

  const collected = new Set(kids.collected);
  const done = regionCollectedCount(region, kids);
  const total = flags.length;
  const accent = regionAccent(region.key);
  const pct = total ? (done / total) * 100 : 0;

  return (
    <div className="flex min-h-full flex-col bg-kid-surface pb-8 font-nunito text-kid-ink">
      {/* header */}
      <div className="flex items-center justify-between px-[18px] pt-5">
        <button
          onClick={goBack}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl leading-none text-kid-ink shadow-[0_4px_0_rgba(43,58,85,.14)] active:translate-y-0.5 active:shadow-none"
        >
          ‹
        </button>
        <span className="font-baloo text-2xl font-extrabold text-kid-ink">{region.label}</span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-extrabold text-white"
          style={{ background: accent.hex, boxShadow: `0 4px 0 ${accent.dark}` }}
        >
          ⭐ {done}/{total}
        </span>
      </div>

      {/* hero */}
      <div
        className="relative mx-[18px] mt-2 overflow-hidden rounded-[30px] px-4 pb-1.5 pt-2.5 text-center"
        style={{ background: `linear-gradient(180deg, ${accent.hex}22 0%, ${accent.hex}38 100%)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: "radial-gradient(circle at 22% 26%, rgba(255,255,255,.5) 0 3px, transparent 4px)", backgroundSize: "70px 70px" }}
        />
        <img
          src={regionArt(region.key)}
          alt={region.label}
          className="relative mx-auto w-[78%] animate-float"
          style={{ filter: "drop-shadow(0 10px 10px rgba(60,60,80,.22))" }}
        />
      </div>

      {/* progress */}
      <div className="mx-5 mt-3.5 flex items-center gap-2.5">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#e2e9f1]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent.hex}, ${accent.dark})` }} />
        </div>
        <span className="font-baloo text-sm font-extrabold" style={{ color: accent.hex }}>{done} of {total}</span>
      </div>

      {/* actions */}
      <div className="flex flex-col gap-3.5 px-5 pb-1.5 pt-3.5">
        <GameButton icon="📖" label="Learn the flags" bg="#2CA8E0" shadow="#1F89BA" onClick={() => navigate(`/kids/learn/${region.key}`)} />
        <GameButton icon="🔎" label="Find the Flag" bg="#FF8A5B" shadow="#E0703F" onClick={() => navigate(`/kids/find/${region.key}`)} />
        <GameButton icon="🃏" label="Flag Match" bg="#7C6CF0" shadow="#5F50CF" onClick={() => navigate(`/kids/match/${region.key}`)} />
      </div>

      {/* your flags */}
      <div className="mt-2.5 px-5">
        <div className="mb-2.5 font-baloo text-[15px] font-bold text-kid-slate">Your flags</div>
        <div className="grid grid-cols-3 gap-3">
          {flags.map((c) => {
            const has = collected.has(c.code);
            return has ? (
              <button key={c.code} onClick={() => speak(c.name)} className="relative active:scale-95">
                <KidFlag country={c} className="shadow-[0_4px_0_rgba(43,58,85,.12)]" />
                <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-kid-gold text-[13px] text-white shadow-[0_2px_0_#e0a91f]">★</span>
              </button>
            ) : (
              <div
                key={c.code}
                className="grid aspect-[3/2] w-full place-items-center rounded-[14px] border-2 border-dashed border-[#c3cfdd] text-[22px] text-[#aeb9c9]"
                style={{ background: "repeating-linear-gradient(135deg,#e5ebf2 0 8px,#dde5ee 8px 16px)" }}
              >
                ?
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GameButton({ icon, label, bg, shadow, onClick }: { icon: string; label: string; bg: string; shadow: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-3xl px-5 py-4 text-left font-baloo text-xl font-bold text-white active:translate-y-1 active:shadow-none"
      style={{ background: bg, boxShadow: `0 7px 0 ${shadow}` }}
    >
      <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-2xl bg-white/20 text-2xl">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="opacity-80">›</span>
    </button>
  );
}
