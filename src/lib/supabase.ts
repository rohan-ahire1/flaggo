import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;
