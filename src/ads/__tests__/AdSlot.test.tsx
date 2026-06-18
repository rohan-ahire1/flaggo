import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdSlot from "../AdSlot";

describe("AdSlot", () => {
  it("renders nothing for Pro users", () => {
    const { container } = render(<AdSlot consent="granted" adsRemoved={true} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing without consent", () => {
    const { container } = render(<AdSlot consent="declined" adsRemoved={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an ad placeholder when explicitly enabled, consented, and not Pro", async () => {
    vi.stubEnv("VITE_ADS_ENABLED", "true");
    vi.resetModules();
    const { default: EnabledAdSlot } = await import("../AdSlot");

    render(<EnabledAdSlot consent="granted" adsRemoved={false} />);
    expect(screen.getByText("Ad space supports free flag learning.")).toBeInTheDocument();
  });
});
