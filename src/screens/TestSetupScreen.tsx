import { useMemo, useState } from "react";
import type { Country } from "../types/country";
import { getPopularityGroups, type PopularityGroup } from "../utils/popularity";

export type TestMode = "recall" | "options";

export default function TestSetupScreen({
  countries,
  onStart
}: {
  countries: Country[];
  onStart: (group: PopularityGroup, mode: TestMode) => void;
}) {
  const groups = useMemo(() => getPopularityGroups(countries), [countries]);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [mode, setMode] = useState<TestMode>("recall");
  const selected = groups.find((group) => group.id === groupId) ?? groups[0];

  return (
    <main className="p-5 pb-24">
      <h1 className="font-display text-3xl font-black">Custom test</h1>
      <p className="mt-1 font-bold text-flaggo-muted">Pick a 50-flag tier, answer in your head, then self-grade after reveal.</p>

      <section className="mt-5 rounded-[28px] bg-white p-5 shadow-[0_8px_0_#e5e7eb]">
        <label className="text-sm font-black uppercase text-flaggo-blue">Country set</label>
        <select
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          className="mt-2 w-full rounded-2xl border-2 border-flaggo-border bg-white p-4 font-black outline-none focus:border-flaggo-blue"
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.title} countries ({group.range})
            </option>
          ))}
        </select>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("recall")}
            className={`rounded-2xl border-b-4 p-4 text-left font-black transition active:translate-y-1 ${
              mode === "recall" ? "border-flaggo-greenDark bg-flaggo-green text-white" : "border-slate-200 bg-slate-50 text-flaggo-text"
            }`}
          >
            Recall only
            <span className="mt-1 block text-xs font-bold opacity-80">No typing</span>
          </button>
          <button
            onClick={() => setMode("options")}
            className={`rounded-2xl border-b-4 p-4 text-left font-black transition active:translate-y-1 ${
              mode === "options" ? "border-flaggo-greenDark bg-flaggo-green text-white" : "border-slate-200 bg-slate-50 text-flaggo-text"
            }`}
          >
            With options
            <span className="mt-1 block text-xs font-bold opacity-80">4 choices</span>
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-flaggo-bg p-4">
          <p className="text-sm font-bold text-flaggo-muted">Selected set</p>
          <p className="mt-1 font-black">{selected?.countries.slice(0, 6).map((country) => country.name).join(", ")}...</p>
        </div>

        <button onClick={() => selected && onStart(selected, mode)} className="flaggo-button mt-5 w-full bg-flaggo-green text-white">
          Start test
        </button>
      </section>
    </main>
  );
}
