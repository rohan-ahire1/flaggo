import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export async function handler(event: { headers: Record<string, string | undefined>; httpMethod: string }) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const token = event.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Missing authorization" });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeKey || !priceId || !siteUrl || !supabaseUrl || !serviceKey) return json(500, { error: "Server is not configured" });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json(401, { error: "Invalid session" });

  const stripe = new Stripe(stripeKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: data.user.id,
    customer_email: data.user.email,
    success_url: `${siteUrl}/pro/success`,
    cancel_url: `${siteUrl}/pro/cancel`
  });

  return json(200, { url: session.url });
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}
