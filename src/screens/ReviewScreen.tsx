import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import ProgressiveResults from "../components/ProgressiveResults";
import { getDueCountries, getWeakCountries } from "@flaggo/core/utils/spacedRepetition";
import { flashcardsPath } from "../navigation/routes";
import { useGame } from "../state/GameProvider";

export default function ReviewScreen() {
  const navigate = useNavigate();
  const { countries, progress, startReview, startMapReview } = useGame();
  const topic = "flag" as const;
  const topicCountries = countries;
  const label = "flags";
  const due = getDueCountries(progress, topicCountries, topic).slice(0, 12);
  const weak = getWeakCountries(progress, topicCountries, topic).slice(0, 6);
  const practice = due.length ? due : weak.length ? weak : topicCountries.slice(0, 8);

  return (
    <main className="p-5">
      <h1 className="screen-title">Review</h1>
      <p className="mt-1 font-bold text-muted">See what is sticking, then revisit each flag right before you forget it.</p>

      <ProgressiveResults
        progress={progress}
        countries={topicCountries}
        hero={{
          eyebrow: "Review queue",
          title: due.length ? `${due.length} ${due.length === 1 ? "flag" : "flags"} ready` : "You're caught up",
          badge: "Spaced repetition",
          description: due.length
            ? "These flags are due now. A quick round will strengthen them before they fade."
            : "Nothing is due right now. Practice anyway to keep your recall sharp."
        }}
        actionLabel={due.length ? `Review ${due.length} due ${due.length === 1 ? "flag" : "flags"}` : "Practice flags"}
        actionIcon="review"
        onAction={() => startReview(practice, topic)}
        onWeakPractice={(countries) =>
          navigate(flashcardsPath({ countryCodes: countries.map((country) => country.code) }))
        }
      />

      <h2 className="mt-6 font-display text-xl font-semibold text-ink">More practice</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <PracticeCard
          icon="globe"
          title="Map practice"
          description="Recall country locations"
          onClick={() => void startMapReview()}
        />
        <PracticeCard
          icon="target"
          title="Custom test"
          description="Choose your own challenge"
          onClick={() => navigate("/test-setup")}
        />
      </div>
    </main>
  );
}

function PracticeCard({ icon, title, description, onClick }: { icon: "globe" | "target"; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-[20px] border border-line bg-paper p-4 text-left shadow-card transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon name={icon} size={21} />
      </span>
      <span className="mt-3 block font-display text-lg font-semibold text-ink">{title}</span>
      <span className="mt-0.5 block text-xs font-semibold leading-snug text-muted">{description}</span>
    </button>
  );
}
