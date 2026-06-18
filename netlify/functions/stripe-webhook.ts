import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

type SupabaseAdminLike = {
  from: (table: string) => {
    upsert: (row: Record<string, unknown>, options: { onConflict: string }) => Promise<unknown>;
  };
};

export async function processCompletedCheckout(session: Stripe.Checkout.Session, admin: SupabaseAdminLike) {
  if (session.payment_status !== "paid" || !session.client_reference_id) return;

  await admin.from("purchases").upsert(
    {
      user_id: session.client_reference_id,
      stripe_session_id: session.id,
      amount: session.amount_total,
      currency: session.currency,
      status: "paid"
    },
    { onConflict: "stripe_session_id" }
  );

  await admin.from("entitlements").upsert(
    {
      user_id: session.client_reference_id,
      ads_removed: true,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
      purchased_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );
}

export async function handler(event: { headers: Record<string, string | undefined>; body: string | null; isBase64Encoded?: boolean }) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) return json(500, { error: "Server is not configured" });

  const signature = event.headers["stripe-signature"];
  if (!signature) return json(400, { error: "Missing Stripe signature" });

  const stripe = new Stripe(stripeKey);
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : event.body ?? "";

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return json(400, { error: "Invalid Stripe signature" });
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const admin = createClient(supabaseUrl, serviceKey) as unknown as SupabaseAdminLike;
    await processCompletedCheckout(stripeEvent.data.object as Stripe.Checkout.Session, admin);
  }

  return json(200, { received: true });
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}
