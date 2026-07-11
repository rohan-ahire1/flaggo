import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import type { Topic } from "@flaggo/core/types/topic";
import { getPopularityGroups } from "@flaggo/core/utils/popularity";
import { useGame } from "../state/GameProvider";

export type TestMode = "recall" | "options";

export default function TestSetupScreen() {
  const navigate = useNavigate();
  const { countries, progress, startFlagTest } = useGame();
  const [topic, setTopic] = useState<Topic>(progress.selectedTopic);
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
      <button onClick={() => navigate("/review")} className="icon-btn mb-4" aria-label="Back">
        <Icon name="chevron" size={20} className="rotate-180" />
      </button>
      <h1 className="screen-title">Custom test</h1>
      <p className="mt-1 font-bold text-muted">Pick a 50-country tier, answer in your head, then self-grade after reveal.</p>

      <section className="mt-5 rounded-[28px] bg-paper p-5 shadow-card-lg">
        <label className="section-label">Topic</label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {([
            ["flag", "Flags"],
            ["capital", "Capitals"]
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTopic(value)}
              className={`btn-secondary items-start justify-start text-left ${topic === value ? "border-primary bg-primary text-white" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="section-label mt-5 block">Country set</label>
        <select
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          className="mt-2 w-full rounded-2xl border-2 border-line bg-paper p-4 font-display font-black outline-none focus:border-primary"
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
            className={`btn-secondary items-start justify-start text-left ${mode === "recall" ? "border-primary bg-primary text-white" : ""}`}
          >
            Recall only
            <span className="mt-1 block text-xs font-bold opacity-80">No typing</span>
          </button>
          <button
            onClick={() => setMode("options")}
            className={`btn-secondary items-start justify-start text-left ${mode === "options" ? "border-primary bg-primary text-white" : ""}`}
          >
            With options
            <span className="mt-1 block text-xs font-bold opacity-80">4 choices</span>
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-paper p-4">
          <p className="text-sm font-bold text-muted">Selected set</p>
          <p className="mt-1 font-display font-black">{selected?.countries.slice(0, 6).map((country) => country.name).join(", ")}...</p>
        </div>

        <button onClick={() => selected && startFlagTest(selected, mode, topic)} className="btn-primary mt-5 w-full">
          Start test
        </button>
      </section>
    </main>
  );
}
