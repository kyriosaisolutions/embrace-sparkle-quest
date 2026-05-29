import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getTenantBySlug = createServerFn({ method: "GET" }).handler(async ({ data: slug }: { data: string }) => {
  const { data, error } = await supabase
    .from("tenants")
    .select(`
      *,
      services (*),
      professionals (*)
    `)
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching tenant:", error);
    return null;
  }

  return data;
});

export const getTenantReviews = createServerFn("GET", async (tenantId: string) => {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      clients (name)
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data;
});
