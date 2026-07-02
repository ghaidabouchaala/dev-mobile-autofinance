import { createClient } from "@supabase/supabase-js";

// AutoFinance production Supabase project — shared with the existing web app.
// Publishable key is safe to ship in client code (RLS enforces access).
const SUPABASE_URL = "https://jpgqxztxaqgvvuqzahpo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pE8NhYMrmY-etRqrXDTrlw_V8uZGXTt";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "autofinance-mobile-auth",
  },
});
