import { countries } from "../data/countries";
import FlagImage from "../components/FlagImage";
import Icon from "../components/Icon";
import { BRAND } from "../config/brand";

export default function WelcomeScreen({ onStart, onExplore }: { onStart: () => void; onExplore: () => void }) {
  const heroFlags = ["JP", "BR", "IN", "ZA", "CA", "KR"]
    .map((code) => countries.find((country) => country.code === code))
    .filter(Boolean);

  return (
    <main className="grid min-h-screen place-items-center bg-hero-sky p-5">
      <section className="flaggo-card w-full animate-pop-in overflow-hidden p-7 text-center">
        <div className="mb-7 grid grid-cols-3 gap-3 rounded-[28px] bg-gradient-to-br from-slate-50 to-flaggo-bg p-3">
          {heroFlags.map(
            (country, i) =>
              country && (
                <div key={country.code} className="animate-float" style={{ animationDelay: `${i * 160}ms` }}>
                  <FlagImage
                    code={country.code}
                    name={country.name}
                    src={country.flagUrl}
                    className="aspect-[4/3] w-full rounded-[18px] p-2 shadow-[0_4px_0_#e5e7eb]"
                  />
                </div>
              )
          )}
        </div>

        <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-flaggo-green/10 px-3 py-1 text-xs font-display font-extrabold uppercase tracking-wide text-flaggo-greenDark">
          <Icon name="globe" size={14} />
          195+ flags
        </div>
        <h1 className="font-display text-5xl font-black tracking-tight text-flaggo-green">{BRAND.name}</h1>
        <p className="mt-3 text-balance text-lg font-bold text-flaggo-muted">
          {BRAND.tagline}
        </p>

        <div className="mt-8 grid gap-3">
          <button
            onClick={onStart}
            className="flaggo-button flex items-center justify-center gap-2 bg-green-grad text-white shadow-button-green"
          >
            <Icon name="bolt" size={20} />
            Start Learning
          </button>
          <button
            onClick={onExplore}
            className="flaggo-button flex items-center justify-center gap-2 border-2 border-b-[5px] border-slate-200 bg-white text-flaggo-blue active:translate-y-[3px] active:border-b-2"
          >
            <Icon name="library" size={18} />
            Explore Flags
          </button>
        </div>
      </section>
    </main>
  );
}
