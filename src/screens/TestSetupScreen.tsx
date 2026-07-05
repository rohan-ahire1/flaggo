import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import type { Country } from "@flaggo/core/types/country";
import type { Topic } from "@flaggo/core/types/topic";
import { getPopularityGroups, type PopularityGroup } from "@flaggo/core/utils/popularity";

export type TestMode = "recall" | "options";

export default function TestSetupScreen({
  countries,
  selectedTopic,
  onStart,
  onBack
}: {
  countries: Country[];
  selectedTopic: Topic;
  onStart: (group: PopularityGroup, mode: TestMode, topic: Topic) => void;
  onBack: () => void;
}) {
  const [topic, setTopic] = useState<Topic>(selectedTopic);
  const topicCountries = useMemo(() => topic === "capital" ? countries.filter((country) => country.capital?.trim()) : countries, [countries, topic]);
  const groups = useMemo(() => getPopularityGroups(topicCountries), [topicCountries]);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [mode, setMode] = useState<TestMode>("recall");
  const selected = groups.find((group) => group.id === groupId) ?? groups[0];
  useEffect(() => {
    setGroupId(groups[0]?.id ?? "");
  }, [groups]);

  return (
    <main className="p-5">
      <button onClick={onBack} className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-white text-flaggo-muted shadow-card" aria-label="Back">
        <Icon name="chevron" size={20} className="rotate-180" />
      </button>
      <h1 className="screen-title">Custom test</h1>
      <p className="mt-1 font-bold text-flaggo-muted">Pick a 50-country tier, answer in your head, then self-grade after reveal.</p>

      <section className="mt-5 rounded-[28px] bg-white p-5 shadow-card-lg">
        <label className="section-label">Topic</label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {([
            ["flag", "Flags"],
            ["capital", "Capitals"]
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTopic(value)}
              className={`rounded-2xl border-b-4 p-4 text-left font-display font-black transition active:translate-y-1 ${
                topic === value ? "border-flaggo-greenDark bg-flaggo-green text-white" : "border-line bg-surface text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="section-label mt-5 block">Country set</label>
        <select
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          className="mt-2 w-full rounded-2xl border-2 border-flaggo-border bg-white p-4 font-display font-black outline-none focus:border-flaggo-blue"
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
            className={`rounded-2xl border-b-4 p-4 text-left font-display font-black transition active:translate-y-1 ${
              mode === "recall" ? "border-flaggo-greenDark bg-flaggo-green text-white" : "border-line bg-surface text-ink"
            }`}
          >
            Recall only
            <span className="mt-1 block text-xs font-bold opacity-80">No typing</span>
          </button>
          <button
            onClick={() => setMode("options")}
            className={`rounded-2xl border-b-4 p-4 text-left font-display font-black transition active:translate-y-1 ${
              mode === "options" ? "border-flaggo-greenDark bg-flaggo-green text-white" : "border-line bg-surface text-ink"
            }`}
          >
            With options
            <span className="mt-1 block text-xs font-bold opacity-80">4 choices</span>
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-flaggo-bg p-4">
          <p className="text-sm font-bold text-flaggo-muted">Selected set</p>
          <p className="mt-1 font-display font-black">{selected?.countries.slice(0, 6).map((country) => country.name).join(", ")}...</p>
        </div>

        <button onClick={() => selected && onStart(selected, mode, topic)} className="btn-primary mt-5 w-full">
          Start test
        </button>
      </section>
    </main>
  );
}
