import { useEffect, useState, type FormEvent } from "react";
import Icon from "./Icon";
import { checkUsernameAvailable, isValidUsername } from "../lib/username";
import { useDialogFocus } from "./useDialogFocus";

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
  const { shellRef, initialFocusRef } = useDialogFocus(open, onCancel);

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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section ref={shellRef} role="dialog" aria-modal="true" aria-labelledby="claim-title" className="w-full max-w-sm rounded-[24px] border border-line bg-paper p-5 shadow-soft animate-pop-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="claim-title" className="font-display text-2xl font-semibold">Claim your player name</h2>
            <p className="mt-1 text-sm font-bold text-muted">Shown on leaderboards and challenges</p>
          </div>
          <button onClick={onCancel} className="rounded-full p-2 font-display font-black text-muted hover:bg-surface" aria-label="Close">
            x
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-display font-semibold text-muted" htmlFor="claim-display-name">
              Player name
            </label>
            <div className="relative">
              <input
                id="claim-display-name"
                ref={initialFocusRef}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="flag_explorer"
                maxLength={20}
                autoComplete="username"
                className={`mt-2 w-full rounded-2xl border-2 bg-paper px-4 py-3 pr-11 font-bold outline-none transition focus:border-primary ${
                  avail === "no" || avail === "invalid" ? "border-error" : "border-line"
                }`}
              />
              {avail === "yes" && (
                <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-primary" aria-label="Username available">
                  <Icon name="check" size={22} />
                </span>
              )}
              {(avail === "no" || avail === "invalid") && (
                <span className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-error" aria-label="Username unavailable">
                  <Icon name="x" size={22} />
                </span>
              )}
            </div>
            <p className={`mt-1.5 text-xs font-bold ${avail === "no" || avail === "invalid" ? "text-error" : "text-muted"}`}>
              {avail === "checking"
                ? "Checking availability..."
                : avail === "yes"
                  ? "Available!"
                  : avail === "no"
                    ? "That username is taken."
                    : "3-20 letters, numbers, or underscores."}
            </p>
          </div>

          {status ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-error">{status}</p> : null}

          <button disabled={disabled} className="btn-primary w-full bg-primary text-white shadow-button disabled:opacity-50">
            {busy ? "Saving..." : "Save name"}
          </button>
          <button type="button" onClick={onCancel} className="w-full py-2 font-display font-black text-muted">
            Not now
          </button>
        </form>
      </section>
    </div>
  );
}
