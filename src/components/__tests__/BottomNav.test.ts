import { describe, expect, it } from "vitest";
import { isTabPath } from "../BottomNav";

describe("bottom navigation matching", () => {
  it("matches learning child routes without matching unrelated pages", () => {
    expect(isTabPath("/learn", ["/", "/learn/*"])).toBe(true);
    expect(isTabPath("/learn/Asia", ["/", "/learn/*"])).toBe(true);
    expect(isTabPath("/library", ["/", "/learn/*"])).toBe(false);
  });

  it("does not activate map practice on map explore", () => {
    expect(isTabPath("/map/explore", ["/review", "/map"])).toBe(false);
    expect(isTabPath("/map/explore", ["/library", "/map/explore"])).toBe(true);
  });
});
