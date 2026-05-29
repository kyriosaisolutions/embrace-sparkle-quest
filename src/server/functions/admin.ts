import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getAdminAgenda = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    date: z.string() // ISO date
  }))
  .handler(async ({ data }) => {
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        *,
        clients (name),
        services (name, duration_minutes)
      `)
      .eq("tenant_id", data.tenant_id)
      .gte("starts_at", startOfDay.toISOString())
      .lte("starts_at", endOfDay.toISOString());

    if (error) {
      console.error("Error fetching agenda:", error);
      return [];
    }

    return appointments;
  });

export const updateAppointmentStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().uuid(),
    status: z.string()
  }))
  .handler(async ({ data }) => {
    const { data: updated, error } = await supabase
      .from("appointments")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("*")
      .single();

    if (error) throw error;
    return updated;
  });

export const getTenantFullData = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const [tenantRes, servicesRes, professionalsRes] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", tenantId).single(),
      supabase.from("services").select("*").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("professionals").select("*").eq("tenant_id", tenantId).order("name")
    ]);

    return {
      tenant: tenantRes.data,
      services: servicesRes.data || [],
      professionals: professionalsRes.data || []
    };
  });
