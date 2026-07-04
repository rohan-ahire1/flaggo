import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { env } from "../config/env";

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);

// React Native has no URL bar, so the session lives in AsyncStorage and we must
// disable detectSessionInUrl (that's a web-only OAuth-redirect concern). The
// OAuth/magic-link callback is handled explicitly via deep links instead.
export const supabase = hasSupabaseConfig
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        flowType: "pkce",
        storageKey: Platform.OS === "web" ? "worldly-auth" : "worldly-native-auth"
      }
    })
  : null;
