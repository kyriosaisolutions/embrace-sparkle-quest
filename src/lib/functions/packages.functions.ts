import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

export const listPackages = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const { data, error } = await supabase
      .from("packages")
      .select("*, services(name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const upsertPackage = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().uuid().optional(),
    tenant_id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional().nullable(),
    total_sessions: z.number().int().min(1),
    service_id: z.string().uuid().optional().nullable(),
    price_cents: z.number().int().min(0),
    valid_days: z.number().int().min(1).default(365),
    active: z.boolean().default(true),
  }))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabase.from("packages").upsert(data).select("*").single();
    if (error) throw error;
    return row;
  });

export const sellPackageToClient = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    package_id: z.string().uuid(),
    client_id: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    const { data: pkg } = await supabase.from("packages").select("*").eq("id", data.package_id).single();
    if (!pkg) throw new Error("Pacote não encontrado");
    const expires_at = new Date(Date.now() + (pkg.valid_days ?? 365) * 86400000).toISOString();
    const { data: row, error } = await supabase
      .from("client_packages")
      .insert({
        tenant_id: data.tenant_id,
        package_id: data.package_id,
        client_id: data.client_id,
        sessions_remaining: pkg.total_sessions,
        expires_at,
      })
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const getClientPackages = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tenant_id: z.string().uuid(), client_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: rows } = await supabase
      .from("client_packages")
      .select("*, packages(name, total_sessions, services(name))")
      .eq("tenant_id", data.tenant_id)
      .eq("client_id", data.client_id)
      .order("purchased_at", { ascending: false });
    return rows ?? [];
  });

export const consumeSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ client_package_id: z.string().uuid(), appointment_id: z.string().uuid().optional() }))
  .handler(async ({ data }) => {
    const { data: cp } = await supabase.from("client_packages").select("*").eq("id", data.client_package_id).single();
    if (!cp) throw new Error("Pacote do cliente não encontrado");
    if (cp.sessions_remaining <= 0) throw new Error("Pacote esgotado");
    const remaining = cp.sessions_remaining - 1;
    const status = remaining === 0 ? "exhausted" : "active";
    await supabase.from("client_packages").update({ sessions_remaining: remaining, status }).eq("id", data.client_package_id);
    if (data.appointment_id) {
      await supabase.from("appointments").update({ client_package_id: data.client_package_id }).eq("id", data.appointment_id);
    }
    return { remaining };
  });
