import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { DAILY_QUESTION_COUNT } from "@flaggo/core/utils/dailyChallenge";
import { progressiveResults } from "@flaggo/core/utils/progressivePractice";
import { useGame } from "../state/GameProvider";

export default function HomeScreen() {
  const navigate = useNavigate();
  const { countries, lessons, progress, openLesson } = useGame();
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyResult = progress.daily.history[todayKey];

  const learning = progressiveResults(progress, countries);
  const completedLessonIds = new Set(progress.completedLessonIds);
  const flagLessons = lessons.filter((lesson) => lesson.topic === "flag");
  const completedFlagLessons = flagLessons.filter((lesson) => completedLessonIds.has(lesson.id));
  const nextFlagLesson = flagLessons.find((lesson) => !completedLessonIds.has(lesson.id));
  const introducedByLessons = new Set(completedFlagLessons.flatMap((lesson) => lesson.countryCodes)).size;
  const introducedPercent = countries.length ? Math.round((introducedByLessons / countries.length) * 100) : 0;
  const isNewLearner = completedFlagLessons.length === 0;

  const startNextFlagLesson = () => nextFlagLesson ? openLesson(nextFlagLesson) : navigate("/learn");

  const moreModes: { label: string; desc: string; icon: IconName; onClick: () => void }[] = [
    { label: "Challenge modes", desc: "120s timed or three strikes", icon: "bolt", onClick: () => navigate("/arcade?mode=timed") },
    { label: "World map", desc: "Find countries", icon: "globe", onClick: () => navigate("/map") },
    { label: "Trivia", desc: "Quick-fire facts", icon: "sparkle", onClick: () => navigate("/trivia") },
    { label: "Custom test", desc: "Choose your challenge", icon: "target", onClick: () => navigate("/test-setup") },
    { label: "Decks", desc: "Build practice sets", icon: "star", onClick: () => navigate("/decks") }
  ];

  return (
    <div className="px-5 pb-5 pt-5">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Your world flag journey</p>
          <h1 className="screen-title mt-1">Learn every flag</h1>
          <p className="mt-1 text-sm font-medium text-muted">One small lesson. Smart reviews. Lasting recall.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-[22px] border border-line bg-surface px-3.5 py-1.5 text-[17px] font-bold text-accent">
          <Icon name="flame" size={17} />
          {progress.streak}
        </div>
      </header>

      <section className="relative mb-4 overflow-hidden rounded-[26px] bg-primary p-5 text-white shadow-card-lg">
        <span className="wl-dots absolute inset-0 opacity-90" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/75">{isNewLearner ? "Start here" : "Your next lesson"}</p>
          <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight">
            {isNewLearner ? "Learn your first flags" : "Continue flag lessons"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-white/80">
            {nextFlagLesson ? `${nextFlagLesson.title} · ${nextFlagLesson.countryCodes.length} flags` : "You completed every flag lesson."}
          </p>
          <button onClick={startNextFlagLesson} className="btn-inverse mt-5 w-full">
            <Icon name="book" size={19} /> {nextFlagLesson ? (isNewLearner ? "Start first lesson" : "Continue lesson") : "Browse lessons"}
          </button>

          <div className="mt-5 border-t border-white/20 pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="font-display text-3xl font-semibold">{introducedByLessons}</span>
                <span className="text-sm font-bold text-white/75"> / {countries.length} introduced</span>
              </div>
              <span className="text-sm font-bold text-white/80">{completedFlagLessons.length}/{flagLessons.length} lessons</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${introducedPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <button
        onClick={() => navigate("/arcade?mode=progressive&start=1")}
        className="mb-4 flex w-full items-center gap-3 rounded-[20px] border border-line bg-surface p-4 text-left shadow-card"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon name="learn" size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold text-ink">Progressive learning</span>
          <span className="block text-[13px] font-medium text-muted">
            Easy flags first · mistakes repeat · {learning.mastered} mastered
          </span>
        </span>
        <Icon name="chevron" size={18} className="shrink-0 text-muted" />
      </button>

      <button
        onClick={() => navigate("/daily")}
        className="mb-6 flex w-full items-center gap-3 rounded-[20px] border border-line bg-surface p-4 text-left shadow-card"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accentDeep">
          <Icon name="today" size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold text-ink">Daily challenge</span>
          <span className="block text-[13px] font-medium text-muted">
            {dailyResult ? `${dailyResult.score}/${dailyResult.total} today · play again` : `${DAILY_QUESTION_COUNT} mixed questions · about 90 seconds`}
          </span>
        </span>
        <Icon name="chevron" size={18} className="shrink-0 text-muted" />
      </button>

      <h2 className="mb-2.5 font-display text-xl font-semibold text-ink">More ways to play</h2>
      <button
        onClick={() => navigate("/learn?view=topics")}
        className="relative mb-3 flex w-full items-center gap-4 overflow-hidden rounded-[22px] bg-primary p-4 text-left text-white shadow-card-lg"
      >
        <span className="wl-dots pointer-events-none absolute inset-0 opacity-60" />
        <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
          <Icon name="globe" size={27} />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Beyond flags</span>
          <span className="block font-display text-xl font-semibold">Learn the whole world</span>
          <span className="mt-0.5 block text-[12.5px] font-semibold text-white/80">Capitals · currencies · locations · languages</span>
        </span>
        <Icon name="chevron" size={18} className="relative shrink-0 text-white/75" />
      </button>
      <div className="grid grid-cols-2 gap-3">
        {moreModes.map((item, index) => (
          <Tile key={item.label} {...item} wide={index === moreModes.length - 1} />
        ))}
      </div>
    </div>
  );
}

function Tile({ label, desc, icon, onClick, wide = false }: { label: string; desc: string; icon: IconName; onClick: () => void; wide?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-[18px] border border-line bg-paper p-3.5 text-left shadow-card ${wide ? "col-span-2" : ""}`}>
      <Icon name={icon} size={22} className="text-primary" />
      <span className="mt-2 block font-semibold text-ink">{label}</span>
      <span className="block text-[13px] font-medium text-muted">{desc}</span>
    </button>
  );
}
