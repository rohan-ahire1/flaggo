import { useState } from "react";

type Props = {
  code: string;
  name: string;
  src: string;
  className?: string;
  imgClassName?: string;
};

export default function FlagImage({ code, name, src, className = "", imgClassName = "" }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`grid overflow-hidden rounded-2xl border border-flaggo-border bg-white p-2 ${className}`}>
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
          className={`m-auto block h-full max-h-full w-full max-w-full object-contain ${imgClassName}`}
        />
      )}
    </div>
  );
}
