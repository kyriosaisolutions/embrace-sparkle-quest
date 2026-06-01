import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase.server";


export const getTenantBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: slug }) => {
    const supabase = getServerSupabase();
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

export const getTenantReviews = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tenantId: z.string().uuid(), page: z.number().int().min(0).default(0) }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const PAGE_SIZE = 10;
    const from = data.page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const [reviewsRes, statsRes] = await Promise.all([
      supabase.from("reviews")
        .select("*, clients(name)")
        .eq("tenant_id", data.tenantId)
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase.from("reviews")
        .select("rating", { count: "exact" })
        .eq("tenant_id", data.tenantId),
    ]);

    const reviews = reviewsRes.data || [];
    const allRatings = statsRes.data || [];
    const count = statsRes.count ?? 0;
    const avgRating = count > 0
      ? allRatings.reduce((s, r) => s + (r.rating || 0), 0) / count
      : 0;

    return {
      reviews,
      totalCount: count,
      avgRating: Math.round(avgRating * 10) / 10,
      hasMore: to < count - 1,
    };
  });
