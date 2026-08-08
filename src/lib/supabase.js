import { createClient } from "@supabase/supabase-js";

/* Supabase's URL and publishable key are public by design — they ship to
   the browser either way. Row Level Security is what protects the data:
   every row is scoped to auth.uid(), so the key alone reads nothing. */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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
