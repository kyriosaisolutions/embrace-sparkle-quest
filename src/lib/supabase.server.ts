import { createClient } from "@supabase/supabase-js";

export function getServerSupabase() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
  );
}