import { useMemo, useState } from "react";
import KidFlag from "../../components/kids/KidFlag";
import { BRAND } from "../../config/brand";
import { useKidsProgress } from "../../hooks/useKidsProgress";
import { useAppBack } from "../../navigation/useAppBack";
import { useGame } from "../../state/GameProvider";
import { REGIONS, isRegionUnlocked, regionCountries } from "../../utils/kidsContinents";
import { speak } from "../../utils/speak";

export default function StickerBookScreen() {
  const goBack = useAppBack("/kids");
  const { countries } = useGame();
  const { kids } = useKidsProgress();
  const collected = new Set(kids.collected);
  const [shared, setShared] = useState(false);

  const groups = useMemo(
    () => REGIONS.map((region) => ({ region, flags: regionCountries(region, countries), unlocked: isRegionUnlocked(region, kids) })),
    [countries, kids]
  );
  const total = groups.reduce((sum, g) => sum + g.flags.length, 0);
  const found = groups.reduce((sum, g) => sum + g.flags.filter((c) => collected.has(c.code)).length, 0);
  const reached = groups.filter((g) => g.unlocked);
  const locked = groups.filter((g) => !g.unlocked);

  // Growth loop: parents brag in parent chats. v1 shares text + link; a rendered
  // image card is the planned follow-up. (board: "Kids Mode v1 share card")
  const share = async () => {
    const text = `My child found ${found} of ${total} world flags on ${BRAND.name} Kids! 🌍⭐`;
    try {
      if (navigator.share) await navigator.share({ title: `${BRAND.name} Kids`, text, url: BRAND.url });
      else {
        await navigator.clipboard.writeText(`${text} ${BRAND.url}`);
        setShared(true);
        window.setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // user dismissed the share sheet — no-op
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-[#fbf5ea] pb-8 font-nunito text-kid-ink">
      {/* header */}
      <div className="flex items-center justify-between px-[18px] pb-2 pt-5">
        <button
          onClick={goBack}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl leading-none text-kid-ink shadow-[0_4px_0_rgba(43,58,85,.14)] active:translate-y-0.5 active:shadow-none"
        >
          ‹
        </button>
        <span className="font-baloo text-[22px] font-extrabold text-kid-ink">Sticker Book</span>
        <button
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-full bg-kid-blue px-3.5 py-2.5 font-baloo text-sm font-bold text-white shadow-[0_4px_0_#1f89ba] active:translate-y-0.5 active:shadow-none"
        >
          ↗ {shared ? "Copied!" : "Share"}
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 pt-1">
        {reached.map(({ region, flags }) => {
          const got = flags.filter((c) => collected.has(c.code)).length;
          const complete = got >= flags.length;
          return (
            <div key={region.key}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="font-baloo text-base font-extrabold text-kid-ink">{region.label}</span>
                {complete && <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-kid-green text-[13px] font-black text-white">✓</span>}
                <span className={`ml-auto text-[13px] font-extrabold ${complete ? "text-region-americas" : "text-kid-coral"}`}>{got}/{flags.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {flags.map((c, i) => {
                  const has = collected.has(c.code);
                  return has ? (
                    <button
                      key={c.code}
                      onClick={() => speak(c.name)}
                      className="relative active:scale-95"
                      style={{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }}
                    >
                      <KidFlag country={c} className="!p-1 shadow-[0_3px_7px_rgba(43,58,85,.18)]" />
                      <span className="absolute -right-1.5 -top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-kid-gold text-[10px] text-white shadow-[0_1px_0_#e0a91f]">★</span>
                    </button>
                  ) : (
                    <div key={c.code} className="grid aspect-[3/2] w-full place-items-center rounded-[10px] border-2 border-dashed border-[#d8ccb4] bg-[#efe7d7] text-base text-[#c3b596]">
                      ?
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {locked.length > 0 && (
          <div className="flex gap-3.5">
            {locked.map(({ region, flags }) => (
              <div key={region.key} className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-[#f3ece0] p-3">
                <span className="text-xl">🔒</span>
                <span className="font-baloo text-[13px] font-bold text-[#a99a80]">{region.label}</span>
                <span className="text-[11px] font-extrabold text-[#bcae94]">0/{flags.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto px-5 pt-3">
        <button
          onClick={share}
          className="w-full rounded-3xl bg-kid-coral py-[18px] font-baloo text-xl font-extrabold text-white shadow-[0_7px_0_#e0703f] active:translate-y-1 active:shadow-none"
        >
          ↗ {shared ? "Copied!" : "Share my sticker book"}
        </button>
      </div>
    </div>
  );
}
