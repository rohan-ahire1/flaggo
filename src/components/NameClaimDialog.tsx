import { useEffect, useState, type FormEvent } from "react";
import Icon from "./Icon";
import { checkUsernameAvailable, isValidUsername } from "../lib/username";

type Availability = "idle" | "invalid" | "checking" | "yes" | "no";

export default function NameClaimDialog({
  open,
  onCancel,
  onSave
}: {
  open: boolean;
  onCancel: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [avail, setAvail] = useState<Availability>("idle");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setAvail("idle");
      setStatus("");
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const value = name.trim();
    if (!value) {
      setAvail("idle");
      return;
    }
    if (!isValidUsername(value)) {
      setAvail("invalid");
      return;
    }
    setAvail("checking");
    const id = window.setTimeout(async () => {
      try {
        setAvail((await checkUsernameAvailable(value)) ? "yes" : "no");
      } catch {
        setAvail("idle");
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [name, open]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (!isValidUsername(value) || avail !== "yes" || busy) return;
    setBusy(true);
    setStatus("");
    try {
      await onSave(value);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save that name.");
      setBusy(false);
    }
  }

  const disabled = busy || !name.trim() || avail === "checking" || avail === "no" || avail === "invalid";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <section className="w-full max-w-sm rounded-[24px] border border-flaggo-border bg-white p-5 shadow-soft animate-pop-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-black">Claim your player name</h2>
            <p className="mt-1 text-sm font-bold text-flaggo-muted">Shown on leaderboards and challenges</p>
          </div>
          <button onClick={onCancel} className="rounded-full p-2 font-display font-black text-flaggo-muted hover:bg-slate-100" aria-label="Close">
            x
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-display font-extrabold text-flaggo-muted" htmlFor="claim-display-name">
              Player name
            </label>
            <div className="relative">
              <input
                id="claim-display-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="flag_explorer"
                maxLength={20}
                autoComplete="username"
                className={`mt-2 w-full rounded-2xl border-2 bg-white px-4 py-3 pr-11 font-bold outline-none transition focus:border-flaggo-green ${
                  avail === "no" || avail === "invalid" ? "border-flaggo-red" : "border-flaggo-border"
                }`}
              />
              {avail === "yes" && (
                <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-flaggo-green" aria-label="Username available">
                  <Icon name="check" size={22} />
                </span>
              )}
              {(avail === "no" || avail === "invalid") && (
                <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-flaggo-red" aria-label="Username unavailable">
                  <Icon name="x" size={22} />
                </span>
              )}
            </div>
            <p className={`mt-1.5 text-xs font-bold ${avail === "no" || avail === "invalid" ? "text-flaggo-red" : "text-flaggo-muted"}`}>
              {avail === "checking"
                ? "Checking availability..."
                : avail === "yes"
                  ? "Available!"
                  : avail === "no"
                    ? "That username is taken."
                    : "3-20 letters, numbers, or underscores."}
            </p>
          </div>

          {status ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-flaggo-red">{status}</p> : null}

          <button disabled={disabled} className="flaggo-button w-full bg-green-grad text-white shadow-button-green disabled:opacity-50">
            {busy ? "Saving..." : "Save name"}
          </button>
          <button type="button" onClick={onCancel} className="w-full py-2 font-display font-black text-flaggo-muted">
            Not now
          </button>
        </form>
      </section>
    </div>
  );
}
