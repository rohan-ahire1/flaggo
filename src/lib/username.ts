import { supabase } from "./supabase";

// Username-only accounts get a synthetic Supabase Auth email under this domain,
// so the user never has to provide a real one. isSyntheticEmail lets the UI
// detect these accounts (e.g. to offer attaching a recovery email later).
export const USERNAME_EMAIL_DOMAIN = "users.flaggo.app";

// Restricted to characters that are also safe as an email local-part.
export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value.trim());
}

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}

export function isSyntheticEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${USERNAME_EMAIL_DOMAIN}`));
}

// Returns true when the username is free. Throws on a real network/RPC error so
// callers can distinguish "taken" from "couldn't check".
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (!supabase || !isValidUsername(username)) return false;
  const { data, error } = await supabase.rpc("username_available", { candidate: username.trim() });
  if (error) throw error;
  return Boolean(data);
}
