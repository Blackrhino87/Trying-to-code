import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY } from "./config.js";

/* Env vars win so a dev build can point at a scratch project; otherwise
   fall back to the committed public config. See config.js on why those
   values are safe to commit. */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // so tapping the emailed link also works
        storageKey: "fight-camp-auth",
      },
    })
  : null;
