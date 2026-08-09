import type { Country } from "@flaggo/core/types/country";
import FlagImage from "../FlagImage";

// One consistent, kid-friendly flag tile used across all Kids screens. Flags come
// in many aspect ratios (Nepal, Qatar, Switzerland…), so we letterbox the WHOLE
// flag inside a fixed 3:2 white card — never crop it — which keeps proportions
// correct and the layout tidy.
export default function KidFlag({
  country,
  className = ""
}: {
  country: Country;
  className?: string;
}) {
  return (
    <FlagImage
      code={country.code}
      name={country.name}
      src={country.flagUrl}
      framed={false}
      fit="contain"
      className={`aspect-[3/2] w-full rounded-[16px] bg-white p-2 ${className}`}
      imgClassName="rounded-[8px]"
    />
  );
}
