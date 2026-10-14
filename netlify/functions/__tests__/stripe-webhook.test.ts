import { describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { handler, processCompletedCheckout } from "../stripe-webhook";

function createAdminMock() {
  const rows: Record<string, unknown[]> = { purchases: [], entitlements: [] };
  return {
    rows,
    admin: {
      from(table: string) {
        return {
          async upsert(row: Record<string, unknown>, options: { onConflict: string }) {
            const key = options.onConflict;
            const existing = rows[table].findIndex((item) => (item as Record<string, unknown>)[key] === row[key]);
            if (existing >= 0) rows[table][existing] = { ...(rows[table][existing] as object), ...row };
            else rows[table].push(row);
            return { error: null };
          }
        };
      }
    }
  };
}

describe("stripe webhook", () => {
  it("upserts checkout completion idempotently", async () => {
    const { admin, rows } = createAdminMock();
    const session = {
      id: "cs_test_123",
      payment_status: "paid",
      client_reference_id: "user_123",
      amount_total: 100,
      currency: "usd",
      customer: "cus_123"
    } as Stripe.Checkout.Session;

    await processCompletedCheckout(session, admin);
    await processCompletedCheckout(session, admin);

    expect(rows.purchases).toHaveLength(1);
    expect(rows.entitlements).toHaveLength(1);
    expect(rows.entitlements[0]).toMatchObject({ user_id: "user_123", ads_removed: true, stripe_customer_id: "cus_123" });
  });

  it("throws when the database write fails so Stripe retries", async () => {
    const admin = {
      from() {
        return { upsert: async () => ({ error: { message: "db down" } }) };
      }
    };
    const session = { id: "cs_test_456", payment_status: "paid", client_reference_id: "user_456" } as Stripe.Checkout.Session;

    await expect(processCompletedCheckout(session, admin)).rejects.toThrow("db down");
  });

  it("rejects invalid signatures", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");

    const response = await handler({
      headers: { "stripe-signature": "bad" },
      body: JSON.stringify({ id: "evt_bad" })
    });

    expect(response.statusCode).toBe(400);
  });
});
