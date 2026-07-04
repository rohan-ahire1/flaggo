import { useState } from "react";

type Props = {
  code: string;
  name: string;
  src: string;
  className?: string;
  imgClassName?: string;
  // "contain" (default) letterboxes the whole flag inside a fixed box with padding.
  // "cover" fills a fixed box, cropping to fit. "natural" lets the card take the
  // flag's own aspect ratio — the whole flag shows, uncropped, with rounded corners.
  fit?: "contain" | "cover" | "natural";
};

export default function FlagImage({ code, name, src, className = "", imgClassName = "", fit = "contain" }: Props) {
  const [failed, setFailed] = useState(false);

  if (fit === "natural") {
    // Card keeps the flag's real aspect (no crop) but the flag is bounded by a max
    // width/height and centered, so extreme ratios (Nepal's portrait pennant, Qatar's
    // very wide bar) stay a sane size instead of blowing up the layout. Rounding the
    // <img> itself rounds the actual flag corners to match the UI.
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-flaggo-border bg-white p-2 ${className}`}>
        {failed ? (
          <div className="grid aspect-[3/2] w-full place-items-center rounded-[14px] bg-slate-100 font-display text-lg font-black text-flaggo-muted">
            {code}
          </div>
        ) : (
          <img
            src={src}
            alt={name}
            loading="eager"
            decoding="async"
            onError={() => setFailed(true)}
            className={`block h-auto w-auto max-w-full rounded-[14px] ${imgClassName}`}
          />
        )}
      </div>
    );
  }

  const cover = fit === "cover";
  return (
    <div className={`grid overflow-hidden rounded-2xl border border-flaggo-border bg-white ${cover ? "" : "p-2"} ${className}`}>
      {failed ? (
        <div className="grid h-full w-full place-items-center rounded-xl bg-slate-100 font-display text-lg font-black text-flaggo-muted">
          {code}
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
          className={`m-auto block h-full max-h-full w-full max-w-full ${cover ? "object-cover" : "object-contain"} ${imgClassName}`}
        />
      )}
    </div>
  );
}
