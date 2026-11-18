// Flaggo API: the privileged server routes (service-role key, Stripe secret).
// Runs as a small Node service on the VPS; Caddy proxies /api/* here.
import { createServer } from "node:http";
import { createApiHandler, routes } from "./app";

const server = createServer(createApiHandler(routes));

const port = Number(process.env.PORT ?? 8796);
server.listen(port, process.env.HOST ?? "127.0.0.1", () => {
  console.log(`flaggo-api listening on ${port}`);
});
