import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

  it("renders an ad placeholder when enabled, consented, and not Pro", () => {
    render(<AdSlot consent="granted" adsRemoved={false} />);
    expect(screen.getByText("Ad space supports free flag learning.")).toBeInTheDocument();
  });
});
