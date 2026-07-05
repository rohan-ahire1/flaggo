import { getQueryParams } from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";
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

export async function signInWithPassword(email: string, password: string): Promise<Result> {
  if (!supabase) return { error: "Sign-in is not configured." };
  const clean = email.trim();
  if (!clean) return { error: "Enter your email." };
  if (!password) return { error: "Enter your password." };
  const { error } = await supabase.auth.signInWithPassword({
    email: clean,
    password
  });
  return error ? { error: error.message } : {};
}

export async function signUpWithPassword(email: string, password: string, displayName: string): Promise<Result> {
  if (!supabase) return { error: "Sign-in is not configured." };
  const clean = email.trim();
  if (!clean) return { error: "Enter your email." };
  if (password.length < 6) return { error: "Use a password with at least 6 characters." };
  const { error } = await supabase.auth.signUp({
    email: clean,
    password,
    options: { data: { full_name: displayName.trim() || null } }
  });
  return error ? { error: error.message } : { message: "Account created. Check your email if confirmation is required." };
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
