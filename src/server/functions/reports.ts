import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

export const getDashboard = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tenant_id: z.string().uuid(), days: z.number().int().min(1).max(365).default(30) }))
  .handler(async ({ data }) => {
    const since = new Date(Date.now() - data.days * 86400000).toISOString();
    const { data: apts } = await supabase
      .from("appointments")
      .select("status, total_cents, starts_at, professional_id, client_id, services(name)")
      .eq("tenant_id", data.tenant_id)
      .gte("starts_at", since);

    const all = apts ?? [];
    const completed = all.filter((a: any) => a.status === "completed");
    const noShow = all.filter((a: any) => a.status === "no_show");
    const cancelled = all.filter((a: any) => a.status === "cancelled");
    const revenue = completed.reduce((s: number, a: any) => s + (a.total_cents ?? 0), 0);
    const avgTicket = completed.length ? Math.round(revenue / completed.length) : 0;

    const byService: Record<string, { count: number; revenue: number }> = {};
    for (const a of completed as any[]) {
      const name = a.services?.name || "—";
      byService[name] = byService[name] || { count: 0, revenue: 0 };
      byService[name].count += 1;
      byService[name].revenue += a.total_cents ?? 0;
    }

    const byDay: Record<string, number> = {};
    for (const a of completed as any[]) {
      const d = a.starts_at?.slice(0, 10);
      if (!d) continue;
      byDay[d] = (byDay[d] || 0) + (a.total_cents ?? 0);
    }

    return {
      totalAppointments: all.length,
      completed: completed.length,
      cancelled: cancelled.length,
      noShow: noShow.length,
      noShowRate: all.length ? noShow.length / all.length : 0,
      revenue,
      avgTicket,
      byService: Object.entries(byService).sort((a, b) => b[1].revenue - a[1].revenue),
      byDay: Object.entries(byDay).sort(),
    };
  });

export const getRetention = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const { data: apts } = await supabase
      .from("appointments")
      .select("client_id, starts_at, total_cents")
      .eq("tenant_id", tenantId)
      .eq("status", "completed");

    const byClient: Record<string, { visits: number; spent: number; first: string; last: string }> = {};
    for (const a of apts ?? []) {
      const id = a.client_id as string;
      if (!id) continue;
      const c = byClient[id] = byClient[id] || { visits: 0, spent: 0, first: a.starts_at, last: a.starts_at };
      c.visits += 1;
      c.spent += a.total_cents ?? 0;
      if (a.starts_at < c.first) c.first = a.starts_at;
      if (a.starts_at > c.last) c.last = a.starts_at;
    }

    const arr = Object.entries(byClient).map(([id, v]) => ({ client_id: id, ...v }));
    const recurring = arr.filter(c => c.visits >= 2).length;
    const recurringRate = arr.length ? recurring / arr.length : 0;
    const dormant30 = arr.filter(c => Date.now() - new Date(c.last).getTime() > 30 * 86400000).length;

    return { totalClients: arr.length, recurring, recurringRate, dormant30, topSpenders: arr.sort((a, b) => b.spent - a.spent).slice(0, 10) };
  });

export const getOccupancy = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tenant_id: z.string().uuid(), days: z.number().int().default(30) }))
  .handler(async ({ data }) => {
    const since = new Date(Date.now() - data.days * 86400000).toISOString();
    const { data: apts } = await supabase
      .from("appointments")
      .select("professional_id, starts_at, ends_at, status, professionals(name)")
      .eq("tenant_id", data.tenant_id)
      .gte("starts_at", since)
      .neq("status", "cancelled");

    const byPro: Record<string, { name: string; bookedMinutes: number }> = {};
    for (const a of apts ?? []) {
      const id = a.professional_id as string;
      if (!id) continue;
      const start = new Date(a.starts_at).getTime();
      const end = new Date(a.ends_at).getTime();
      const mins = Math.max(0, (end - start) / 60000);
      byPro[id] = byPro[id] || { name: (a as any).professionals?.name || "—", bookedMinutes: 0 };
      byPro[id].bookedMinutes += mins;
    }
    return Object.entries(byPro).map(([id, v]) => ({ professional_id: id, ...v }));
  });
