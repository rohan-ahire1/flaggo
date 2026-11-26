// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { admin: { createUser } } }))
}));

import { handler } from "../username-signup";

const ENV_KEYS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const savedEnv: Record<string, string | undefined> = {};

function post(body: unknown) {
  return handler({ httpMethod: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
}

describe("username-signup handler", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    process.env.SUPABASE_URL = "https://dummy.supabase.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy-service-key";
    createUser.mockReset();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  it("rejects non-POST requests with 405", async () => {
    const res = await handler({ httpMethod: "GET", body: null });
    expect(res.statusCode).toBe(405);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON with 400", async () => {
    const res = await post("{not json");
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ error: "Invalid request" });
  });

  it.each(["ab", "bad name!"])("rejects username %j with the length/charset message", async (username) => {
    const res = await post({ username, password: "secret1" });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toContain("3–20 letters");
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rejects passwords under 6 characters with 400", async () => {
    const res = await post({ username: "player1", password: "12345" });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/at least 6 characters/);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 500 when the server env is missing", async () => {
    delete process.env.SUPABASE_URL;
    const res = await post({ username: "player1", password: "secret1" });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: "Server is not configured" });

    process.env.SUPABASE_URL = "https://dummy.supabase.test";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res2 = await post({ username: "player1", password: "secret1" });
    expect(res2.statusCode).toBe(500);
    expect(JSON.parse(res2.body)).toEqual({ error: "Server is not configured" });
  });

  it("creates a confirmed user with a lowercased synthetic email", async () => {
    createUser.mockResolvedValue({ error: null });
    const res = await post({ username: "  PlayerOne  ", password: "secret1" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "playerone@users.flaggo.app",
        email_confirm: true,
        password: "secret1"
      })
    );
  });

  it("maps a duplicate-user error to 409", async () => {
    createUser.mockResolvedValue({ error: { message: "User already registered" } });
    const res = await post({ username: "player1", password: "secret1" });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body)).toEqual({ error: "That username is taken." });
  });

  it("maps an invalid-email error to a 500 config message", async () => {
    createUser.mockResolvedValue({ error: { message: "Unable to validate email address: invalid email" } });
    const res = await post({ username: "player1", password: "secret1" });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toContain("not configured correctly");
  });
});
