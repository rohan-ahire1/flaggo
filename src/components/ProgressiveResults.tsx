import type { Country } from "@flaggo/core/types/country";
import type { AppProgress } from "@flaggo/core/types/progress";
import { reviewKey } from "@flaggo/core/types/topic";
import {
  PROGRESSIVE_STAGE_LABELS,
  PROGRESSIVE_STAGES,
  PROGRESSIVE_TIER_SIZE,
  progressiveResults,
} from "@flaggo/core/utils/progressivePractice";
import FlagImage from "./FlagImage";
import Icon, { type IconName } from "./Icon";

type Hero = {
  eyebrow: string;
  title: string;
  badge: string;
  description: string;
};

type Props = {
  progress: AppProgress;
  countries: Country[];
  actionLabel: string;
  actionIcon: IconName;
  onAction: () => void;
  hero?: Hero;
  onWeakPractice?: (countries: Country[]) => void;
};

export default function ProgressiveResults({
  progress,
  countries,
  actionLabel,
  actionIcon,
  onAction,
  hero,
  onWeakPractice
}: Props) {
  const results = progressiveResults(progress, countries);
  const stageNumber = PROGRESSIVE_STAGES.indexOf(results.stage) + 1;
  const summary = hero ?? {
    eyebrow: "Current stage",
    title: PROGRESSIVE_STAGE_LABELS[results.stage],
    badge: `${PROGRESSIVE_TIER_SIZE} flags`,
    description: `Stage ${stageNumber} of ${PROGRESSIVE_STAGES.length} · earlier mistakes keep returning.`
  };
  const weak = countries
    .filter((country) => {
      const state = progress.review[reviewKey(country.code, "flag")];
      return Boolean(state && state.wrongCount > 0 && state.box < 5);
    })
    .sort((a, b) => (progress.review[reviewKey(b.code, "flag")]?.wrongCount ?? 0) - (progress.review[reviewKey(a.code, "flag")]?.wrongCount ?? 0))
    .slice(0, 5);

  return (
    <div className="pb-2">
      <section className="mt-5 rounded-[22px] bg-primary p-5 text-white shadow-card-lg">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/75">{summary.eyebrow}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold">{summary.title}</h2>
          <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{summary.badge}</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-white/80">{summary.description}</p>
      </section>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ResultStat value={results.seen} label="Introduced" />
        <ResultStat value={results.mastered} label="Mastered" />
        <ResultStat value={results.needsRepetition} label="To repeat" />
      </div>

      <section className="mt-5 rounded-[22px] border border-line bg-paper p-4 shadow-card">
        <h2 className="font-display text-lg font-semibold">Progress by stage</h2>
        <div className="mt-4 space-y-4">
          {results.tiers.map((tier) => {
            const pct = tier.total ? Math.round((tier.seen / tier.total) * 100) : 0;
            return (
              <div key={tier.stage}>
                <div className="flex items-center justify-between gap-3 text-sm font-bold">
                  <span>{PROGRESSIVE_STAGE_LABELS[tier.stage]}</span>
                  <span className="text-right text-muted">{tier.seen}/{tier.total} introduced · {tier.mastered} mastered</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {weak.length > 0 && (
        <section className="mt-5 rounded-[22px] border border-line bg-paper p-4 shadow-card">
          <h2 className="font-display text-lg font-semibold">Needs repetition</h2>
          <div className="mt-3 grid gap-2">
            {weak.map((country) => {
              const misses = progress.review[reviewKey(country.code, "flag")]?.wrongCount ?? 0;
              return (
                <div key={country.code} className="flex items-center gap-3 rounded-2xl bg-surface p-2.5">
                  <FlagImage code={country.code} name={country.name} src={country.flagUrl} fit="natural" framed={false} className="w-12" imgClassName="max-h-9" />
                  <span className="min-w-0 flex-1 truncate text-left font-display font-semibold">{country.name}</span>
                  <span className="shrink-0 text-xs font-bold text-error">{misses} {misses === 1 ? "miss" : "misses"}</span>
                </div>
              );
            })}
          </div>
          {onWeakPractice && (
            <button onClick={() => onWeakPractice(weak)} className="btn-secondary mt-3 w-full">
              <Icon name="review" size={18} />
              Practice {weak.length} missed {weak.length === 1 ? "flag" : "flags"}
            </button>
          )}
        </section>
      )}

      <button onClick={onAction} className="btn-primary mt-5 w-full">
        <Icon name={actionIcon} size={19} /> {actionLabel}
      </button>
    </div>
  );
}

function ResultStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-paper p-3 text-center shadow-card">
      <div className="font-display text-2xl font-semibold text-primary">{value}</div>
      <div className="mt-0.5 text-[11px] font-bold text-muted">{label}</div>
    </div>
  );
}
