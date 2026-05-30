import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

export const openComanda = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    client_id: z.string().uuid().optional().nullable(),
    appointment_id: z.string().uuid().optional().nullable(),
    opened_by: z.string().uuid().optional().nullable(),
  }))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabase.from("comandas").insert(data).select("*").single();
    if (error) throw error;
    return row;
  });

export const addComandaItem = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    comanda_id: z.string().uuid(),
    kind: z.enum(["service","product"]),
    service_id: z.string().uuid().optional().nullable(),
    product_id: z.string().uuid().optional().nullable(),
    professional_id: z.string().uuid().optional().nullable(),
    description: z.string(),
    quantity: z.number().int().min(1).default(1),
    unit_price_cents: z.number().int().min(0),
  }))
  .handler(async ({ data }) => {
    const total = data.unit_price_cents * data.quantity;
    const { data: item, error } = await supabase
      .from("comanda_items")
      .insert({ ...data, total_cents: total })
      .select("*")
      .single();
    if (error) throw error;
    await recalcComanda(data.comanda_id);
    return item;
  });

async function recalcComanda(comandaId: string) {
  const { data: items } = await supabase.from("comanda_items").select("total_cents").eq("comanda_id", comandaId);
  const subtotal = (items ?? []).reduce((s, i: any) => s + (i.total_cents ?? 0), 0);
  const { data: c } = await supabase.from("comandas").select("discount_cents").eq("id", comandaId).single();
  const total = subtotal - (c?.discount_cents ?? 0);
  await supabase.from("comandas").update({ subtotal_cents: subtotal, total_cents: total }).eq("id", comandaId);
}

export const removeComandaItem = createServerFn({ method: "POST" })
  .inputValidator(z.object({ item_id: z.string().uuid(), comanda_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await supabase.from("comanda_items").delete().eq("id", data.item_id);
    await recalcComanda(data.comanda_id);
    return { ok: true };
  });

export const applyComandaDiscount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ comanda_id: z.string().uuid(), discount_cents: z.number().int().min(0) }))
  .handler(async ({ data }) => {
    await supabase.from("comandas").update({ discount_cents: data.discount_cents }).eq("id", data.comanda_id);
    await recalcComanda(data.comanda_id);
    return { ok: true };
  });

export const closeComanda = createServerFn({ method: "POST" })
  .inputValidator(z.object({ comanda_id: z.string().uuid(), payment_method: z.string() }))
  .handler(async ({ data }) => {
    const { data: c } = await supabase.from("comandas").select("*").eq("id", data.comanda_id).single();
    if (!c) throw new Error("Comanda não encontrada");

    const { data: items } = await supabase.from("comanda_items").select("*").eq("comanda_id", data.comanda_id);
    for (const it of items ?? []) {
      if (it.kind === "product" && it.product_id) {
        const { data: p } = await supabase.from("products").select("stock_qty").eq("id", it.product_id).single();
        if (p) {
          await supabase.from("products").update({ stock_qty: (p.stock_qty ?? 0) - it.quantity }).eq("id", it.product_id);
          await supabase.from("stock_movements").insert({
            tenant_id: c.tenant_id,
            product_id: it.product_id,
            kind: "sale",
            quantity: -it.quantity,
            reference_id: data.comanda_id,
          });
        }
      }
    }

    const { error } = await supabase
      .from("comandas")
      .update({ status: "paid", payment_method: data.payment_method, paid_at: new Date().toISOString() })
      .eq("id", data.comanda_id);
    if (error) throw error;
    return { ok: true };
  });

export const getComanda = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: id }) => {
    const [c, items] = await Promise.all([
      supabase.from("comandas").select("*, clients(name)").eq("id", id).single(),
      supabase.from("comanda_items").select("*").eq("comanda_id", id).order("created_at"),
    ]);
    return { comanda: c.data, items: items.data ?? [] };
  });

export const listOpenComandas = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const { data } = await supabase
      .from("comandas")
      .select("*, clients(name)")
      .eq("tenant_id", tenantId)
      .eq("status", "open")
      .order("created_at", { ascending: false });
    return data ?? [];
  });
