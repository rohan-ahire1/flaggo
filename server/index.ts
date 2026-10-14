// Flaggo API: the privileged server routes (service-role key, Stripe secret).
// Runs as a small Node service on the VPS; Caddy proxies /api/* here.
import { createServer, type IncomingMessage } from "node:http";
import { handler as createCheckoutSession } from "./functions/create-checkout-session";
import { handler as deleteAccount } from "./functions/delete-account";
import { handler as stripeWebhook } from "./functions/stripe-webhook";
import { handler as usernameSignup } from "./functions/username-signup";

type Event = { httpMethod: string; headers: Record<string, string | undefined>; body: string | null };
type Result = { statusCode: number; headers?: Record<string, string>; body: string };

const routes: Record<string, (event: Event) => Promise<Result>> = {
  "/api/create-checkout-session": createCheckoutSession,
  "/api/delete-account": deleteAccount,
  "/api/stripe-webhook": stripeWebhook,
  "/api/username-signup": usernameSignup
};

const MAX_BODY_BYTES = 1024 * 1024;

async function readBody(req: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Body too large");
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks).toString("utf8") : null;
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  if (path === "/api/health") {
    res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
    return;
  }

  const route = routes[path];
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
    console.error(err);
    if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
    res.end('{"error":"Server error"}');
  }
});

const port = Number(process.env.PORT ?? 8796);
server.listen(port, process.env.HOST ?? "127.0.0.1", () => {
  console.log(`flaggo-api listening on ${port}`);
});
