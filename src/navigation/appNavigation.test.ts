import { describe, expect, it } from "vitest";
import { APP_TABS, hasAppChrome, tabForPath } from "./appNavigation";

describe("app navigation hierarchy", () => {
  it.each([
    ["/", "learn"],
    ["/review", "review"],
    ["/test-setup", "review"],
    ["/map", "review"],
    ["/decks", "review"],
    ["/library", "library"],
    ["/map/explore", "library"],
    ["/profile", "profile"],
    ["/stats", "profile"]
  ])("assigns %s to the %s tab", (pathname, tab) => {
    expect(tabForPath(pathname)?.id).toBe(tab);
  });

  it.each([
    "/welcome",
    "/review/play",
    "/review/flashcards",
    "/test",
    "/map/play",
    "/daily",
    "/arcade",
    "/trivia",
    "/kids",
    "/kids/region/Europe"
  ])("keeps immersive route %s free of app chrome", (pathname) => {
    expect(hasAppChrome(pathname)).toBe(false);
    expect(tabForPath(pathname)).toBeNull();
  });

  it("shows app chrome on every tab-owned screen", () => {
    for (const tab of APP_TABS) {
      for (const pathname of tab.paths) {
        expect(hasAppChrome(pathname)).toBe(true);
      }
    }
  });

  it("has one canonical destination per tab", () => {
    expect(APP_TABS.map((tab) => tab.to)).toEqual(["/", "/review", "/library", "/profile"]);
    expect(new Set(APP_TABS.map((tab) => tab.to)).size).toBe(APP_TABS.length);
  });
});
