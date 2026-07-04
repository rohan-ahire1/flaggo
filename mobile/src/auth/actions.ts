import { getQueryParams } from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { env } from "../config/env";
import { supabase } from "../lib/supabase";

export function getAuthRedirectUrl(): string {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") return new URL("/auth/callback", window.location.origin).toString();
    return new URL("/auth/callback", env.siteUrl).toString();
  }
  return Linking.createURL("/auth/callback");
}

type Result = { error?: string; message?: string };

// Exchange the ?code=... on an incoming callback URL for a Supabase session.
export async function createSessionFromUrl(url: string): Promise<Result> {
  if (!supabase) return { error: "Sign-in is not configured." };
  const { params, errorCode } = getQueryParams(url);
  if (errorCode) return { error: errorCode };
  const { code } = params;
  if (!code) return {};
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? { error: error.message } : {};
}

export async function signInWithGoogle(): Promise<Result> {
  if (!supabase) return { error: "Sign-in is not configured." };
  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== "web" }
  });
  if (error) return { error: error.message };
  if (Platform.OS === "web") return {};
  if (!data?.url) return { error: "Could not start Google sign-in." };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === "success" && result.url) {
    return createSessionFromUrl(result.url);
  }
  return {};
}

export async function signInWithEmail(email: string): Promise<Result> {
  if (!supabase) return { error: "Sign-in is not configured." };
  const clean = email.trim();
  if (!clean) return { error: "Enter your email." };
  const redirectTo = getAuthRedirectUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: { emailRedirectTo: redirectTo }
  });
  return error ? { error: error.message } : { message: "Check your email for a sign-in link." };
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
