// @vitest-environment node
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApiHandler, type Event } from "../app";

let server: Server;
let base: string;
let lastEvent: Event | undefined;

beforeAll(async () => {
  const handler = createApiHandler({
    "/api/echo": async (event) => {
      lastEvent = event;
      return { statusCode: 200, headers: { "content-type": "application/json" }, body: '{"ok":"echo"}' };
    },
    "/api/boom": async () => {
      throw new Error("boom");
    }
  });
  server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("api handler", () => {
  it("answers /api/health", async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("returns 404 for unknown paths", async () => {
    const res = await fetch(`${base}/api/nope`);
    expect(res.status).toBe(404);
  });

  it("passes method, lower-cased headers and body to the route", async () => {
    const res = await fetch(`${base}/api/echo`, {
      method: "POST",
      headers: { "X-Custom-Header": "Value" },
      body: "hello"
    });
    expect(res.status).toBe(200);
    expect(lastEvent?.httpMethod).toBe("POST");
    expect(lastEvent?.headers["x-custom-header"]).toBe("Value");
    expect(lastEvent?.body).toBe("hello");
  });

  it("returns 413 for bodies over 1 MB without logging an error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await fetch(`${base}/api/echo`, { method: "POST", body: "x".repeat(1024 * 1024 + 1) });
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "Body too large" });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("returns 500 when a route throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await fetch(`${base}/api/boom`);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Server error" });
    errorSpy.mockRestore();
  });
});
