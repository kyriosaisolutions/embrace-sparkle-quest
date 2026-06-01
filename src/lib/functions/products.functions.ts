import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");
    if (error) throw error;
    return data;
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().uuid().optional(),
    tenant_id: z.string().uuid(),
    name: z.string().min(1),
    sku: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    cost_cents: z.number().int().min(0).default(0),
    price_cents: z.number().int().min(0),
    stock_qty: z.number().int().default(0),
    min_stock_qty: z.number().int().min(0).default(0),
    image_url: z.string().optional().nullable(),
    active: z.boolean().default(true),
  }))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabase
      .from("products")
      .upsert({ ...data, updated_at: new Date().toISOString() })
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const adjustStock = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    product_id: z.string().uuid(),
    kind: z.enum(["in","out","adjust","sale","loss"]),
    quantity: z.number().int(),
    reason: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { data: prod } = await supabase.from("products").select("stock_qty").eq("id", data.product_id).single();
    if (!prod) throw new Error("Produto não encontrado");
    const delta = (data.kind === "out" || data.kind === "sale" || data.kind === "loss") ? -Math.abs(data.quantity) : data.quantity;
    const newQty = (prod.stock_qty ?? 0) + delta;
    await supabase.from("stock_movements").insert({ ...data, quantity: delta });
    const { data: updated, error } = await supabase
      .from("products")
      .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
      .eq("id", data.product_id)
      .select("*")
      .single();
    if (error) throw error;
    return updated;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: id }) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const getLowStock = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("active", true);
    return (data ?? []).filter((p: any) => p.stock_qty <= p.min_stock_qty);
  });
