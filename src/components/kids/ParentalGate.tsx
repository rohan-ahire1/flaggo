import { useMemo, useState } from "react";

// A parental gate guards actions meant for grown-ups (leaving Kids Mode,
// toggling voice). It's the standard app-store pattern: a simple multiplication
// a young child can't yet do, so kids stay put but parents pass in a second.
// A tap keypad avoids popping the mobile keyboard on a kid's device.

export default function ParentalGate({
  onPass,
  onCancel
}: {
  onPass: () => void;
  onCancel: () => void;
}) {
  const { a, b } = useMemo(() => ({ a: 3 + Math.floor(Math.random() * 6), b: 3 + Math.floor(Math.random() * 6) }), []);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  const press = (d: string) => {
    setWrong(false);
    setValue((v) => (v.length >= 3 ? v : v + d));
  };
  const back = () => {
    setWrong(false);
    setValue((v) => v.slice(0, -1));
  };
  const submit = () => {
    if (Number(value) === a * b) onPass();
    else {
      setWrong(true);
      setValue("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#121a2c]/60 p-6 font-nunito">
      <div className="w-full max-w-xs rounded-[24px] bg-white p-7 shadow-[0_30px_60px_rgba(0,0,0,.4)]">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef2f7] text-2xl">🔒</div>
          <div className="mt-1.5 text-[22px] font-extrabold text-kid-ink">Grown-ups only</div>
          <div className="text-sm font-semibold leading-snug text-[#6d7f9c]">Please solve this to continue.</div>
        </div>

        <div className="mt-5 text-center text-3xl font-extrabold tracking-wide text-kid-ink">
          {a} × {b} = ?
        </div>
        <div
          className={`mt-4 flex h-14 items-center justify-center rounded-2xl border-2 text-2xl font-extrabold tracking-[6px] text-kid-ink ${wrong ? "animate-shake border-rose-400 bg-rose-50" : "border-[#dce4ee] bg-[#f7fafd]"}`}
        >
          {value || <span className="text-[#c3cfdd]">·</span>}
        </div>
        {wrong && <p className="mt-2 text-center text-sm font-semibold text-rose-500">Try again</p>}

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} onClick={() => press(d)} className="rounded-xl bg-[#f2f5f9] py-3.5 text-xl font-extrabold text-kid-ink active:bg-[#e6ebf2]">
              {d}
            </button>
          ))}
          <button onClick={back} aria-label="Delete" className="rounded-xl bg-[#f2f5f9] py-3.5 text-xl font-extrabold text-[#6d7f9c] active:bg-[#e6ebf2]">
            ⌫
          </button>
          <button onClick={() => press("0")} className="rounded-xl bg-[#f2f5f9] py-3.5 text-xl font-extrabold text-kid-ink active:bg-[#e6ebf2]">
            0
          </button>
          <button onClick={submit} aria-label="Continue" className="rounded-xl bg-kid-green py-3.5 text-xl font-extrabold text-white active:translate-y-0.5">
            ✓
          </button>
        </div>

        <div className="mt-4 flex gap-2.5">
          <button onClick={onCancel} className="flex-1 rounded-2xl border-2 border-[#dce4ee] bg-white py-3.5 text-[15px] font-extrabold text-[#6d7f9c]">
            Cancel
          </button>
          <button onClick={submit} className="flex-1 rounded-2xl bg-kid-ink py-3.5 text-[15px] font-extrabold text-white">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
