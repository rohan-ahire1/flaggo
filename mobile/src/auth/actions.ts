import { getQueryParams } from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { env } from "../config/env";
import { supabase } from "../lib/supabase";
import { isValidUsername, usernameToEmail } from "../lib/username";

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
  if (!clean) return { error: "Enter your email or username." };
  if (!password) return { error: "Enter your password." };
  const { error } = await supabase.auth.signInWithPassword({
    email: clean.includes("@") ? clean : isValidUsername(clean) ? usernameToEmail(clean) : clean,
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

export async function signUpWithUsername(username: string, password: string): Promise<Result> {
  if (!supabase) return { error: "Sign-in is not configured." };
  const clean = username.trim();
  if (!clean) return { error: "Enter a username." };
  if (password.length < 6) return { error: "Use a password with at least 6 characters." };

  try {
    const response = await fetch(`${env.siteUrl}/.netlify/functions/username-signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: clean, password })
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { error: payload?.error ?? "Could not create that username account." };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create that username account." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(clean),
    password
  });
  return error ? { error: error.message } : { message: "Account created." };
}

export async function resetPasswordForEmail(email: string): Promise<Result> {
  if (!supabase) return { error: "Sign-in is not configured." };
  const clean = email.trim();
  if (!clean) return { error: "Enter your email first." };
  const { error } = await supabase.auth.resetPasswordForEmail(clean, {
    redirectTo: `${env.siteUrl}/auth/callback?type=recovery`
  });
  return error ? { error: error.message } : { message: "Check your email." };
}

export async function deleteAccount(): Promise<Result> {
  if (!supabase) return { error: "Sign-in is not configured." };
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { error: sessionError.message };
  const token = data.session?.access_token;
  if (!token) return { error: "Sign in to delete your account." };

  try {
    const response = await fetch(`${env.siteUrl}/.netlify/functions/delete-account`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { error: payload?.error ?? "Could not delete your account." };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete your account." };
  }

  await signOut();
  return {};
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
