import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

export const getFinanceKPIs = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayApts, pendingComm, monthApts, logs] = await Promise.all([
      supabase.from("appointments")
        .select("total_cents, payment_method, clients(name), services(name), starts_at, status")
        .eq("tenant_id", tenantId)
        .gte("starts_at", startOfDay.toISOString())
        .lte("starts_at", endOfDay.toISOString())
        .order("starts_at", { ascending: true }),
      supabase.from("commission_logs")
        .select("commission_cents, professional_id")
        .eq("tenant_id", tenantId)
        .eq("paid", false),
      supabase.from("appointments")
        .select("total_cents")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("starts_at", startOfMonth.toISOString()),
      supabase.from("commission_logs")
        .select("*, professionals(name)")
        .eq("tenant_id", tenantId)
        .order("calculated_at", { ascending: false })
        .limit(50),
    ]);

    const todayRevenue = (todayApts.data || [])
      .filter(a => a.status === "completed")
      .reduce((s, a) => s + (a.total_cents || 0), 0);

    const pendingTotal = (pendingComm.data || [])
      .reduce((s, c) => s + (c.commission_cents || 0), 0);

    const monthRows = monthApts.data || [];
    const avgTicket = monthRows.length > 0
      ? Math.round(monthRows.reduce((s, a) => s + (a.total_cents || 0), 0) / monthRows.length)
      : 0;

    return {
      todayRevenue,
      pendingCommissions: pendingTotal,
      avgTicket,
      todayTransactions: todayApts.data || [],
      commissionLogs: logs.data || [],
    };
  });

export const getCommissionsByProfessional = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [commissions, completedApts] = await Promise.all([
      supabase.from("commission_logs")
        .select("professional_id, commission_cents, professionals(name, photo_url, commission_value)")
        .eq("tenant_id", tenantId)
        .eq("paid", false),
      supabase.from("appointments")
        .select("professional_id")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("starts_at", startOfMonth.toISOString()),
    ]);

    const byPro: Record<string, { id: string; name: string; photo_url: string; pendingTotal: number; monthCount: number; commission_value: number }> = {};
    for (const c of (commissions.data || []) as any[]) {
      const id = c.professional_id;
      if (!byPro[id]) {
        byPro[id] = {
          id,
          name: c.professionals?.name ?? "Profissional",
          photo_url: c.professionals?.photo_url ?? "",
          pendingTotal: 0,
          monthCount: 0,
          commission_value: c.professionals?.commission_value ?? 0,
        };
      }
      byPro[id].pendingTotal += c.commission_cents;
    }
    for (const a of (completedApts.data || []) as any[]) {
      if (byPro[a.professional_id]) byPro[a.professional_id].monthCount += 1;
    }

    return Object.values(byPro);
  });
