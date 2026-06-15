import type { AppProgress } from "../types/progress";

export default function ProfileScreen({ progress, onReset }: { progress: AppProgress; onReset: () => void }) {
  return (
    <main className="p-5 pb-24">
      <section className="rounded-[28px] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-flaggo-green text-4xl font-black text-white">F</div>
        <h1 className="mt-4 text-3xl font-black">Flaggo learner</h1>
      </section>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          ["XP", progress.xp],
          ["Streak", progress.streak],
          ["Coins", progress.coins],
          ["Flags seen", Object.keys(progress.review).length]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[22px] bg-white p-4 shadow-sm">
            <div className="text-2xl font-black text-flaggo-blue">{value}</div>
            <div className="font-bold text-flaggo-muted">{label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          if (window.confirm("Reset all Flaggo progress?")) onReset();
        }}
        className="flaggo-button mt-8 w-full bg-flaggo-red text-white"
      >
        Reset progress
      </button>
    </main>
  );
}
