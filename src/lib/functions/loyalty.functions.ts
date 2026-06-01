import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase.server";


export const getLoyaltyRules = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const supabase = getServerSupabase();
    const { data } = await supabase.from("loyalty_rules").select("*").eq("tenant_id", tenantId).maybeSingle();
    return data;
  });

export const upsertLoyaltyRules = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    enabled: z.boolean(),
    points_per_currency_unit: z.number().default(1),
    currency_unit_cents: z.number().int().default(100),
    points_to_currency_unit: z.number().default(100),
    reward_currency_unit_cents: z.number().int().default(100),
    min_redeem_points: z.number().int().default(100),
    expires_in_days: z.number().int().optional().nullable(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { error } = await supabase.from("loyalty_rules").upsert({ ...data, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });

export const getClientPoints = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tenant_id: z.string().uuid(), client_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: rows } = await supabase
      .from("loyalty_ledger")
      .select("delta, expires_at")
      .eq("tenant_id", data.tenant_id)
      .eq("client_id", data.client_id);
    const now = Date.now();
    const balance = (rows ?? []).reduce((s, r: any) => {
      if (r.expires_at && new Date(r.expires_at).getTime() < now) return s;
      return s + (r.delta ?? 0);
    }, 0);
    return { balance };
  });

export const addPoints = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    client_id: z.string().uuid(),
    delta: z.number().int(),
    reason: z.string(),
    appointment_id: z.string().uuid().optional().nullable(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: rows } = await supabase
      .from("loyalty_ledger")
      .select("delta")
      .eq("tenant_id", data.tenant_id)
      .eq("client_id", data.client_id);
    const balance_before = (rows ?? []).reduce((s, r: any) => s + (r.delta ?? 0), 0);
    const balance_after = balance_before + data.delta;
    const { data: rules } = await supabase.from("loyalty_rules").select("expires_in_days").eq("tenant_id", data.tenant_id).maybeSingle();
    const expires_at = rules?.expires_in_days
      ? new Date(Date.now() + rules.expires_in_days * 86400000).toISOString()
      : null;
    const { error } = await supabase.from("loyalty_ledger").insert({ ...data, balance_after, expires_at });
    if (error) throw error;
    return { balance_after };
  });
