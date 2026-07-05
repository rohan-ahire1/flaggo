import { createClient } from "@supabase/supabase-js";

// Creates a username-only account (no real email) with a synthetic, already-
// confirmed email, so these users can sign in immediately even when the project
// has email confirmation enabled. The client signs in with the password after.
const USERNAME_EMAIL_DOMAIN = "users.flaggo.app";
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function handler(event: { httpMethod: string; body: string | null }) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let username = "";
  let password = "";
  try {
    const parsed = JSON.parse(event.body ?? "{}");
    username = String(parsed.username ?? "").trim();
    password = String(parsed.password ?? "");
  } catch {
    return json(400, { error: "Invalid request" });
  }

  if (!USERNAME_RE.test(username)) return json(400, { error: "Usernames are 3–20 letters, numbers, or underscores." });
  if (password.length < 6) return json(400, { error: "Use a password with at least 6 characters." });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return json(500, { error: "Server is not configured" });

  const admin = createClient(supabaseUrl, serviceKey);
  const email = `${username.toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: username, username }
  });

  if (error) {
    // Duplicate synthetic email or username unique-index violation => taken.
    const taken = /already|exists|duplicate|registered|unique/i.test(error.message);
    return json(taken ? 409 : 500, { error: taken ? "That username is taken." : error.message });
  }

  return json(200, { ok: true });
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}
