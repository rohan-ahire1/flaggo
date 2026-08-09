import { describe, expect, it } from "vitest";
import { isTabPath } from "../BottomNav";

describe("bottom navigation matching", () => {
  it("matches only explicitly owned tab routes", () => {
    expect(isTabPath("/", ["/"])).toBe(true);
    expect(isTabPath("/review", ["/"])).toBe(false);
    expect(isTabPath("/learn", ["/"])).toBe(false);
  });

  it("does not activate map practice on map explore", () => {
    expect(isTabPath("/map/explore", ["/review", "/map"])).toBe(false);
    expect(isTabPath("/map/explore", ["/library", "/map/explore"])).toBe(true);
  });
});
