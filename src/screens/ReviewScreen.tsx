import { useNavigate } from "react-router-dom";
import FlagCard from "../components/FlagCard";
import Icon from "../components/Icon";
import { reviewKey } from "@flaggo/core/types/topic";
import { getDueCountries, getWeakCountries } from "@flaggo/core/utils/spacedRepetition";
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
      <h1 className="screen-title">Practice</h1>
      <p className="mt-1 font-bold text-muted">Spaced repetition brings back {label} right before you'd forget them.</p>
      <section className="mt-5 overflow-hidden rounded-[24px] border border-line bg-paper p-5 shadow-card-lg">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="review" size={28} />
          </span>
          <div>
            <div className="font-display text-5xl font-black leading-none text-primary">{due.length}</div>
            <p className="mt-1 font-bold text-muted">{due.length ? `${label} due for review` : "No reviews due today."}</p>
          </div>
        </div>
        <button onClick={() => startReview(practice, topic)} className="btn-primary mt-5 w-full">
          <Icon name="bolt" size={20} /> {due.length ? "Review due flags" : "Practice flags"}
        </button>
      </section>
      <h2 className="mt-7 font-display text-xl font-semibold text-ink">More practice</h2>
      <section className="mt-3 rounded-[24px] border border-line bg-paper p-5 shadow-card-lg">
        <h2 className="font-display text-2xl font-black">Map practice</h2>
        <p className="mt-1 font-bold text-muted">Review country locations with the same spaced-repetition schedule.</p>
        <button onClick={() => void startMapReview()} className="btn-secondary mt-5 w-full">
          <Icon name="globe" size={18} /> Start map practice
        </button>
      </section>
      <section className="mt-5 rounded-[24px] border border-line bg-paper p-5 shadow-card-lg">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-display font-semibold uppercase tracking-wide text-primaryDark">
          <Icon name="sparkle" size={13} /> New
        </p>
        <h2 className="mt-2 font-display text-2xl font-black">50-country test</h2>
        <p className="mt-1 font-bold text-muted">Choose Top 50, 51-100, and beyond. Practice with typed recall or answer choices.</p>
        <button onClick={() => navigate("/test-setup")} className="btn-secondary mt-5 w-full">
          <Icon name="target" size={18} /> Configure test
        </button>
      </section>
      <h2 className="mt-6 flex items-center gap-2 font-display text-xl font-black">
        <Icon name="heart" size={18} className="text-error" /> Weakest {label}
      </h2>
      {weak.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {weak.map((country) => <FlagCard key={country.code} country={country} review={progress.review[reviewKey(country.code, topic)]} onClick={() => startReview([country], topic)} />)}
        </div>
      ) : <p className="mt-3 font-bold text-muted">Practice will include new {label} until weak {label} appear.</p>}
    </main>
  );
}
