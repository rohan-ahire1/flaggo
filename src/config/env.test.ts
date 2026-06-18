import { describe, expect, it } from "vitest";
import { assertClientEnv } from "./env";

describe("env config", () => {
  it("fails loudly in dev when required vars are missing", () => {
    expect(() => assertClientEnv(["VITE_SUPABASE_URL"], true)).toThrow("Missing Flaggo env vars: VITE_SUPABASE_URL");
  });

  it("does not throw in production mode", () => {
    expect(() => assertClientEnv(["VITE_SUPABASE_URL"], false)).not.toThrow();
  });
});
