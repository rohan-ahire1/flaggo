import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider, useConfirm } from "../ConfirmDialog";

function Harness({ onResolve }: { onResolve: (value: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button
      onClick={() => {
        void confirm({ title: "End this round?", body: "Answered questions are already counted.", confirmLabel: "End round" }).then(onResolve);
      }}
    >
      Open
    </button>
  );
}

describe("ConfirmDialog", () => {
  it("resolves false on Escape", async () => {
    const onResolve = vi.fn();
    render(<ConfirmProvider><Harness onResolve={onResolve} /></ConfirmProvider>);

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.keyDown(window, { key: "Escape" });

    await vi.waitFor(() => expect(onResolve).toHaveBeenCalledWith(false));
  });

  it("resolves true on confirm", async () => {
    const onResolve = vi.fn();
    render(<ConfirmProvider><Harness onResolve={onResolve} /></ConfirmProvider>);

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByRole("button", { name: "End round" }));

    await vi.waitFor(() => expect(onResolve).toHaveBeenCalledWith(true));
  });
});
