// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const deleteUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { getUser, admin: { deleteUser } } }))
}));

import { handler } from "../delete-account";

const ENV_KEYS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const savedEnv: Record<string, string | undefined> = {};

describe("delete-account handler", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    process.env.SUPABASE_URL = "https://dummy.supabase.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy-service-key";
    getUser.mockReset();
    deleteUser.mockReset();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  it("rejects non-POST requests with 405", async () => {
    const res = await handler({ httpMethod: "GET", headers: { authorization: "Bearer tok" } });
    expect(res.statusCode).toBe(405);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("rejects a missing authorization header with 401", async () => {
    const res = await handler({ httpMethod: "POST", headers: {} });
    expect(res.statusCode).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns 401 'Invalid session' when getUser fails", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "bad jwt" } });
    const res = await handler({ httpMethod: "POST", headers: { authorization: "Bearer bad" } });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body)).toEqual({ error: "Invalid session" });
    expect(getUser).toHaveBeenCalledWith("bad");
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("deletes the user returned by getUser and returns 200", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    deleteUser.mockResolvedValue({ error: null });
    const res = await handler({ httpMethod: "POST", headers: { authorization: "Bearer good" } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ deleted: true });
    expect(deleteUser).toHaveBeenCalledWith("user-123");
  });

  it("returns 500 when deleteUser fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    deleteUser.mockResolvedValue({ error: { message: "db down" } });
    const res = await handler({ httpMethod: "POST", headers: { authorization: "Bearer good" } });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: "db down" });
  });
});
