import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out.match(/.{1,4}/g)!.join("-");
}

export const issueGiftCard = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    initial_value_cents: z.number().int().min(1),
    purchaser_client_id: z.string().uuid().optional().nullable(),
    recipient_name: z.string().optional().nullable(),
    recipient_email: z.string().email().optional().nullable(),
    message: z.string().optional().nullable(),
    valid_days: z.number().int().default(365),
  }))
  .handler(async ({ data }) => {
    const code = generateCode();
    const expires_at = new Date(Date.now() + data.valid_days * 86400000).toISOString();
    const { data: row, error } = await supabase
      .from("gift_cards")
      .insert({
        tenant_id: data.tenant_id,
        code,
        initial_value_cents: data.initial_value_cents,
        balance_cents: data.initial_value_cents,
        purchaser_client_id: data.purchaser_client_id,
        recipient_name: data.recipient_name,
        recipient_email: data.recipient_email,
        message: data.message,
        expires_at,
      })
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const lookupGiftCard = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tenant_id: z.string().uuid(), code: z.string() }))
  .handler(async ({ data }) => {
    const { data: gc } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("tenant_id", data.tenant_id)
      .eq("code", data.code)
      .maybeSingle();
    if (!gc) return null;
    if (gc.expires_at && new Date(gc.expires_at).getTime() < Date.now()) {
      return { ...gc, status: "expired" };
    }
    return gc;
  });

export const redeemGiftCard = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    gift_card_id: z.string().uuid(),
    amount_cents: z.number().int().min(1),
    appointment_id: z.string().uuid().optional().nullable(),
  }))
  .handler(async ({ data }) => {
    const { data: gc } = await supabase.from("gift_cards").select("*").eq("id", data.gift_card_id).single();
    if (!gc) throw new Error("Vale-presente não encontrado");
    if (gc.status !== "active") throw new Error("Vale-presente inativo");
    if (gc.balance_cents < data.amount_cents) throw new Error("Saldo insuficiente");
    const new_balance = gc.balance_cents - data.amount_cents;
    const status = new_balance === 0 ? "redeemed" : "active";
    await supabase.from("gift_cards").update({ balance_cents: new_balance, status }).eq("id", data.gift_card_id);
    await supabase.from("gift_card_redemptions").insert({
      gift_card_id: data.gift_card_id,
      appointment_id: data.appointment_id,
      amount_cents: data.amount_cents,
    });
    return { new_balance };
  });

export const listGiftCards = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const { data } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });
