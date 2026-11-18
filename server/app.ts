// Request handling for the Flaggo API. Kept separate from index.ts so it can be tested
// without starting a listener.
import type { IncomingMessage, ServerResponse } from "node:http";
import { handler as createCheckoutSession } from "./functions/create-checkout-session";
import { handler as deleteAccount } from "./functions/delete-account";
import { handler as stripeWebhook } from "./functions/stripe-webhook";
import { handler as usernameSignup } from "./functions/username-signup";

export type Event = { httpMethod: string; headers: Record<string, string | undefined>; body: string | null };
export type Result = { statusCode: number; headers?: Record<string, string>; body: string };
export type Routes = Record<string, (event: Event) => Promise<Result>>;

export const routes: Routes = {
  "/api/create-checkout-session": createCheckoutSession,
  "/api/delete-account": deleteAccount,
  "/api/stripe-webhook": stripeWebhook,
  "/api/username-signup": usernameSignup
};

export const MAX_BODY_BYTES = 1024 * 1024;

export class BodyTooLargeError extends Error {
  constructor() {
    super("Body too large");
    this.name = "BodyTooLargeError";
  }
}

async function readBody(req: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new BodyTooLargeError();
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks).toString("utf8") : null;
}

export function createApiHandler(routeMap: Routes) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path === "/api/health") {
      res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
      return;
    }

    const route = Object.hasOwn(routeMap, path) ? routeMap[path] : undefined;
    if (!route) {
      res.writeHead(404, { "content-type": "application/json" }).end('{"error":"Not found"}');
      return;
    }

    try {
      const headers = Object.fromEntries(
        Object.entries(req.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : value])
      );
      const result = await route({ httpMethod: req.method ?? "GET", headers, body: await readBody(req) });
      res.writeHead(result.statusCode, result.headers).end(result.body);
    } catch (err) {
      if (err instanceof BodyTooLargeError) {
        if (!res.headersSent) res.writeHead(413, { "content-type": "application/json", connection: "close" });
        res.end('{"error":"Body too large"}');
        return;
      }
      console.error(err);
      if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
      res.end('{"error":"Server error"}');
    }
  };
}
