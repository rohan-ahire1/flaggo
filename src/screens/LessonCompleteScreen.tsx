export type LessonResult = {
  xpEarned: number;
  accuracy: number;
  correct: number;
  total: number;
  streak: number;
  coinsEarned: number;
};

export default function LessonCompleteScreen({ result, onContinue }: { result: LessonResult; onContinue: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="flaggo-card w-full p-7 text-center">
        <div className="mx-auto mb-5 grid h-24 w-24 place-items-center rounded-full bg-green-100 text-5xl font-black text-flaggo-green">OK</div>
        <h1 className="text-3xl font-black">Lesson Complete!</h1>
        <div className="my-6 rounded-[24px] bg-flaggo-bg p-5">
          <div className="animate-xp-pop text-5xl font-black text-flaggo-green">+{result.xpEarned} XP</div>
          <div className="mt-2 font-bold text-flaggo-muted">Accuracy: {result.accuracy}%</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-slate-50 p-4 font-bold">Correct<br /><span className="text-2xl text-flaggo-blue">{result.correct}/{result.total}</span></div>
          <div className="rounded-2xl bg-slate-50 p-4 font-bold">Streak<br /><span className="text-2xl text-flaggo-orange">{result.streak} days</span></div>
          <div className="col-span-2 rounded-2xl bg-slate-50 p-4 text-center font-bold">Coins earned <span className="text-2xl text-flaggo-yellow">+{result.coinsEarned}</span></div>
        </div>
        <button onClick={onContinue} className="flaggo-button mt-6 w-full bg-flaggo-green text-white">Continue</button>
      </section>
    </main>
  );
}
