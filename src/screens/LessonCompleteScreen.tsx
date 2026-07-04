import ResultCard, { type ResultStat } from "../components/ResultCard";
import type { Topic } from "../types/topic";

export type LessonResult = {
  xpEarned: number;
  accuracy: number;
  correct: number;
  total: number;
  streak: number;
  coinsEarned: number;
  topic: Topic;
};

function praiseFor(accuracy: number) {
  if (accuracy >= 100) return "Perfect run!";
  if (accuracy >= 80) return "Great job!";
  if (accuracy >= 50) return "Nice progress";
  return "Keep practicing";
}

export default function LessonCompleteScreen({ result, onContinue, adSlot }: { result: LessonResult; onContinue: () => void; adSlot?: React.ReactNode }) {
  const perfect = result.correct === result.total;
  const title = result.topic === "location" ? "Map practice complete" : "Lesson complete";

  const stats: ResultStat[] = [
    { icon: "check", label: "Correct", value: `${result.correct}/${result.total}`, tone: "text-flaggo-green" },
    { icon: "flame", label: "Streak", value: `${result.streak} day${result.streak === 1 ? "" : "s"}`, tone: "text-flaggo-orange" }
  ];
  if (result.coinsEarned > 0) stats.push({ icon: "coin", label: "Coins", value: `+${result.coinsEarned}`, tone: "text-flaggo-yellow" });

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-hero-sky p-5">
      <div className="w-full max-w-md">
        <ResultCard
          title={title}
          praise={praiseFor(result.accuracy)}
          ringPercent={result.accuracy}
          heroValue={`+${result.xpEarned}`}
          heroCaption="XP earned"
          heroIcon="bolt"
          stats={stats}
          confetti={perfect}
          actions={[{ label: "Continue", onClick: onContinue }]}
        >
          {adSlot}
        </ResultCard>
      </div>
    </main>
  );
}
