import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

export const searchTenants = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    q: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    category: z.string().optional(),
    page: z.number().int().min(0).default(0),
  }))
  .handler(async ({ data }) => {
    const PAGE_SIZE = 20;
    let query = supabase.from("tenants").select("id, name, slug, city, state, logo_url, description", { count: "exact" });
    if (data.q) query = query.ilike("name", `%${data.q}%`);
    if (data.city) query = query.ilike("city", `%${data.city}%`);
    if (data.state) query = query.eq("state", data.state.toUpperCase());
    query = query.range(data.page * PAGE_SIZE, data.page * PAGE_SIZE + PAGE_SIZE - 1);
    const { data: tenants, count } = await query;

    if (!tenants?.length) return { results: [], totalCount: count ?? 0, hasMore: false };

    const ids = tenants.map(t => t.id);
    const { data: reviews } = await supabase.from("reviews").select("tenant_id, rating").in("tenant_id", ids);
    const stats: Record<string, { sum: number; n: number }> = {};
    for (const r of reviews ?? []) {
      const id = r.tenant_id as string;
      stats[id] = stats[id] || { sum: 0, n: 0 };
      stats[id].sum += r.rating ?? 0;
      stats[id].n += 1;
    }

    const results = tenants.map(t => ({
      ...t,
      avg_rating: stats[t.id]?.n ? Math.round((stats[t.id].sum / stats[t.id].n) * 10) / 10 : 0,
      review_count: stats[t.id]?.n ?? 0,
    }));

    return {
      results,
      totalCount: count ?? 0,
      hasMore: data.page * PAGE_SIZE + PAGE_SIZE < (count ?? 0),
    };
  });

export const getCitySuggestions = createServerFn({ method: "GET" })
  .inputValidator(z.string().min(2))
  .handler(async ({ data: q }) => {
    const { data } = await supabase
      .from("tenants")
      .select("city, state")
      .ilike("city", `%${q}%`)
      .limit(20);
    const seen = new Set<string>();
    return (data ?? []).filter(d => {
      const k = `${d.city}-${d.state}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return !!d.city;
    });
  });
