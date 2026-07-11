import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useDialogFocus } from "./useDialogFocus";

type ConfirmOptions = {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const close = useCallback((value: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    current?.resolve(value);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    pendingRef.current?.resolve(false);
    return new Promise<boolean>((resolve) => {
      const next = { ...options, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialogView options={pending} onClose={close} />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used within ConfirmProvider");
  return confirm;
}

function ConfirmDialogView({
  options,
  onClose
}: {
  options: PendingConfirm | null;
  onClose: (value: boolean) => void;
}) {
  const open = Boolean(options);
  const { shellRef, initialFocusRef } = useDialogFocus(open, () => onClose(false));
  if (!options) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(false);
      }}
    >
      <section
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm animate-pop-in rounded-[24px] border border-line bg-paper p-5 shadow-soft"
      >
        <h2 id="confirm-title" className="font-display text-2xl font-semibold text-ink">{options.title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-muted">{options.body}</p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={() => onClose(true)}
            className={options.destructive ? "btn-danger" : "btn-primary"}
          >
            {options.confirmLabel ?? "Confirm"}
          </button>
          <button ref={initialFocusRef} type="button" onClick={() => onClose(false)} className="btn-secondary">
            {options.cancelLabel ?? "Cancel"}
          </button>
        </div>
      </section>
    </div>
  );
}
