import { countries } from "../data/countries";
import FlagImage from "../components/FlagImage";

export default function WelcomeScreen({ onStart, onExplore }: { onStart: () => void; onExplore: () => void }) {
  const heroFlags = ["JP", "BR", "IN", "ZA", "CA", "KR"]
    .map((code) => countries.find((country) => country.code === code))
    .filter(Boolean);

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="flaggo-card w-full overflow-hidden p-7 text-center">
        <div className="-mx-2 mb-7 grid grid-cols-3 gap-3 rounded-[28px] bg-flaggo-bg p-3">
          {heroFlags.map((country) => country && (
            <FlagImage key={country.code} code={country.code} name={country.name} src={country.flagUrl} className="aspect-[4/3] w-full rounded-[18px] p-2 shadow-[0_4px_0_#e5e7eb]" />
          ))}
        </div>
        <h1 className="text-5xl font-black text-flaggo-green">Flaggo</h1>
        <p className="mt-3 text-lg font-bold text-flaggo-muted">Learn world flags one tiny lesson at a time.</p>
        <div className="mt-8 grid gap-3">
          <button onClick={onStart} className="flaggo-button bg-flaggo-green text-white">Start Learning</button>
          <button onClick={onExplore} className="flaggo-button border-b-4 border-slate-200 bg-white text-flaggo-blue">Explore Flags</button>
        </div>
      </section>
    </main>
  );
}
