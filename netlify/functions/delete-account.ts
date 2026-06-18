import { createClient } from "@supabase/supabase-js";

export async function handler(event: { headers: Record<string, string | undefined>; httpMethod: string }) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const token = event.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Missing authorization" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return json(500, { error: "Server is not configured" });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json(401, { error: "Invalid session" });

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) return json(500, { error: deleteError.message });
  return json(200, { deleted: true });
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}
