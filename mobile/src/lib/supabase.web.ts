import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const webStorage = {
  getItem(key: string): string | null {
    return getLocalStorage()?.getItem(key) ?? null;
  },
  setItem(key: string, value: string): void {
    getLocalStorage()?.setItem(key, value);
  },
  removeItem(key: string): void {
    getLocalStorage()?.removeItem(key);
  }
};

export const supabase = hasSupabaseConfig
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: webStorage,
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        flowType: "pkce",
        storageKey: "worldly-auth"
      }
    })
  : null;
