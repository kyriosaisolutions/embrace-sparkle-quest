import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase.server";


export const listCoupons = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const supabase = getServerSupabase();
    const { data } = await supabase
      .from("coupons")
      .select("*, services(name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const upsertCoupon = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().uuid().optional(),
    tenant_id: z.string().uuid(),
    code: z.string().min(2),
    kind: z.enum(["percentage","fixed"]),
    value: z.number().min(0),
    min_total_cents: z.number().int().min(0).default(0),
    max_uses: z.number().int().optional().nullable(),
    starts_at: z.string().optional().nullable(),
    expires_at: z.string().optional().nullable(),
    service_id: z.string().uuid().optional().nullable(),
    active: z.boolean().default(true),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: row, error } = await supabase
      .from("coupons")
      .upsert({ ...data, code: data.code.toUpperCase() })
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const validateCoupon = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    code: z.string(),
    total_cents: z.number().int(),
    service_id: z.string().uuid().optional(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: c } = await supabase
      .from("coupons")
      .select("*")
      .eq("tenant_id", data.tenant_id)
      .eq("code", data.code.toUpperCase())
      .eq("active", true)
      .maybeSingle();
    if (!c) return { valid: false, reason: "Cupom inválido" };
    const now = Date.now();
    if (c.starts_at && new Date(c.starts_at).getTime() > now) return { valid: false, reason: "Cupom ainda não ativo" };
    if (c.expires_at && new Date(c.expires_at).getTime() < now) return { valid: false, reason: "Cupom expirado" };
    if (c.max_uses && c.uses_count >= c.max_uses) return { valid: false, reason: "Cupom esgotado" };
    if (data.total_cents < c.min_total_cents) return { valid: false, reason: `Valor mínimo R$ ${(c.min_total_cents / 100).toFixed(2)}` };
    if (c.service_id && data.service_id && c.service_id !== data.service_id) return { valid: false, reason: "Cupom não aplica a este serviço" };
    const discount_cents = c.kind === "percentage"
      ? Math.round(data.total_cents * (c.value / 100))
      : Math.min(Math.round(c.value * 100), data.total_cents);
    return { valid: true, coupon_id: c.id, discount_cents };
  });

export const redeemCoupon = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    coupon_id: z.string().uuid(),
    appointment_id: z.string().uuid().optional().nullable(),
    client_id: z.string().uuid().optional().nullable(),
    discount_cents: z.number().int(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    await supabase.from("coupon_redemptions").insert(data);
    const { data: c } = await supabase.from("coupons").select("uses_count").eq("id", data.coupon_id).single();
    await supabase.from("coupons").update({ uses_count: (c?.uses_count ?? 0) + 1 }).eq("id", data.coupon_id);
    return { ok: true };
  });
