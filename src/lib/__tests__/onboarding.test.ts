import { beforeEach, describe, expect, it } from "vitest";
import { completeOnboarding, hasCompletedOnboarding, resetOnboarding } from "../onboarding";

describe("onboarding state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts incomplete", () => {
    expect(hasCompletedOnboarding()).toBe(false);
  });

  it("remembers when onboarding is completed", () => {
    completeOnboarding();

    expect(hasCompletedOnboarding()).toBe(true);
  });

  it("can be reset with the rest of the user progress", () => {
    completeOnboarding();
    resetOnboarding();

    expect(hasCompletedOnboarding()).toBe(false);
  });
});
