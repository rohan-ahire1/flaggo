import { describe, expect, it } from "vitest";
import type { Country } from "../../types/country";
import { defaultProgress } from "../../types/progress";
import { arcadeKey } from "../../types/arcade";
import { arcadePool, arcadeScore, persistArcadeBest } from "../arcade";

const countries: Country[] = [
  { code: "FR", name: "France", continent: "Europe", difficulty: "easy", isUNMember: true, isIndependent: true, flagUrl: "", capital: "Paris" },
  { code: "TD", name: "Chad", continent: "Africa", difficulty: "medium", isUNMember: true, isIndependent: true, flagUrl: "", capital: "N'Djamena" },
  { code: "ZZ", name: "Hard", continent: "Europe", difficulty: "hard", isUNMember: true, isIndependent: true, flagUrl: "" }
];

describe("arcade", () => {
  it("scores modes and formats keys", () => {
    expect(arcadeScore("timed", [true, false, true])).toBe(2);
    expect(arcadeScore("sudden", [true, true, false, true])).toBe(2);
    expect(arcadeKey("hard", "location")).toBe("hard-location");
  });

  it("restricts hard pool and persists best scores", () => {
    expect(arcadePool(countries, "hard", "flag").map((country) => country.code).sort()).toEqual(["TD", "ZZ"]);
    const first = persistArcadeBest(defaultProgress, "timed", "flag", 4);
    const second = persistArcadeBest(first, "timed", "flag", 2);
    expect(second.arcade["timed-flag"]).toBe(4);
  });
});
