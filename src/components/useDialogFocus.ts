import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function useDialogFocus(open: boolean, onClose: () => void) {
  const shellRef = useRef<any>(null);
  const initialFocusRef = useRef<any>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const shell = shellRef.current;
    const initial = initialFocusRef.current;
    window.setTimeout(() => (initial ?? (shell as HTMLElement | null)?.querySelector(FOCUSABLE) as HTMLElement | null)?.focus(), 0);

    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !shell) return;
      const items = Array.from((shell as HTMLElement).querySelectorAll(FOCUSABLE)) as HTMLElement[];
      const visible = items.filter((item) => item.offsetParent !== null);
      if (!visible.length) return;
      const first = visible[0];
      const last = visible[visible.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [onClose, open]);

  return { shellRef, initialFocusRef };
}
