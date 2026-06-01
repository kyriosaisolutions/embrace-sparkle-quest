import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase.server";


export const openComanda = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    client_id: z.string().uuid().optional().nullable(),
    appointment_id: z.string().uuid().optional().nullable(),
    opened_by: z.string().uuid().optional().nullable(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
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
    const supabase = getServerSupabase();
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
  const supabase = getServerSupabase();
  const { data: items } = await supabase.from("comanda_items").select("total_cents").eq("comanda_id", comandaId);
  const subtotal = (items ?? []).reduce((s, i: any) => s + (i.total_cents ?? 0), 0);
  const { data: c } = await supabase.from("comandas").select("discount_cents").eq("id", comandaId).single();
  const total = subtotal - (c?.discount_cents ?? 0);
  await supabase.from("comandas").update({ subtotal_cents: subtotal, total_cents: total }).eq("id", comandaId);
}

export const removeComandaItem = createServerFn({ method: "POST" })
  .inputValidator(z.object({ item_id: z.string().uuid(), comanda_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    await supabase.from("comanda_items").delete().eq("id", data.item_id);
    await recalcComanda(data.comanda_id);
    return { ok: true };
  });

export const applyComandaDiscount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ comanda_id: z.string().uuid(), discount_cents: z.number().int().min(0) }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    await supabase.from("comandas").update({ discount_cents: data.discount_cents }).eq("id", data.comanda_id);
    await recalcComanda(data.comanda_id);
    return { ok: true };
  });

export const closeComanda = createServerFn({ method: "POST" })
  .inputValidator(z.object({ comanda_id: z.string().uuid(), payment_method: z.string() }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: c } = await supabase.from("comandas").select("*").eq("id", data.comanda_id).single();
    if (!c) throw new Error("Comanda não encontrada");

    // 1. Verificar caixa aberto antes de qualquer alteração
    const { data: session, error: sessionErr } = await supabase
      .from("cash_sessions")
      .select("id")
      .eq("tenant_id", c.tenant_id)
      .eq("status", "open")
      .maybeSingle();
    if (sessionErr) throw sessionErr;
    if (!session) {
      throw new Error("Não há caixa aberto. Abra o caixa antes de fechar a comanda.");
    }

    const { data: items } = await supabase.from("comanda_items").select("*").eq("comanda_id", data.comanda_id);

    // 2. Baixa de estoque para produtos (comportamento existente)
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

    // 3. Cálculo de comissão por item de serviço.
    // commission_logs.appointment_id é NOT NULL no schema, portanto só podemos
    // gravar comissão para comandas vinculadas a um agendamento. Quando há
    // appointment_id, o trigger calculate_appointment_commission já calcula
    // ao concluir o agendamento — para evitar duplicidade, só inserimos se
    // ainda não existir log para o agendamento.
    for (const it of items ?? []) {
      if (it.kind !== "service" || !it.professional_id || !it.service_id) continue;
      if (!c.appointment_id) continue;

      const { data: existing } = await supabase
        .from("commission_logs")
        .select("id")
        .eq("appointment_id", c.appointment_id)
        .eq("professional_id", it.professional_id)
        .maybeSingle();
      if (existing) continue;

      // Buscar taxa específica (professional + service)
      const { data: psc } = await supabase
        .from("professional_service_commissions")
        .select("commission_rate")
        .eq("professional_id", it.professional_id)
        .eq("service_id", it.service_id)
        .maybeSingle();

      let commissionCents = 0;
      let commissionRate = 0;

      if (psc && psc.commission_rate != null) {
        commissionRate = Number(psc.commission_rate);
        commissionCents = Math.round((it.total_cents * commissionRate) / 100);
      } else {
        // Fallback: professionals.commission_value + commission_type
        const { data: prof } = await supabase
          .from("professionals")
          .select("commission_value, commission_type")
          .eq("id", it.professional_id)
          .maybeSingle();
        const value = Number(prof?.commission_value ?? 0);
        const type = prof?.commission_type ?? null;

        if (value > 0) {
          const isPercentage =
            type === "percentage" || (type == null && value > 0 && value <= 100);
          if (isPercentage) {
            commissionRate = value;
            commissionCents = Math.round((it.total_cents * value) / 100);
          } else {
            // valor fixo em BRL
            commissionRate = 0;
            commissionCents = Math.round(value * 100);
          }
        }
      }

      if (commissionCents > 0) {
        await supabase.from("commission_logs").insert({
          tenant_id: c.tenant_id,
          appointment_id: c.appointment_id,
          professional_id: it.professional_id,
          service_price_cents: it.total_cents,
          commission_rate: commissionRate,
          commission_cents: commissionCents,
          paid: false,
        });
      }
    }

    // 4. Registrar movimento de caixa
    const { error: movErr } = await supabase.from("cash_movements").insert({
      session_id: session.id,
      tenant_id: c.tenant_id,
      kind: "sale",
      amount_cents: c.total_cents,
      payment_method: data.payment_method,
      appointment_id: c.appointment_id ?? null,
    });
    if (movErr) throw movErr;

    // 5. Marcar comanda como paga
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
    const supabase = getServerSupabase();
    const [c, items] = await Promise.all([
      supabase.from("comandas").select("*, clients(name)").eq("id", id).single(),
      supabase.from("comanda_items").select("*").eq("comanda_id", id).order("created_at"),
    ]);
    return { comanda: c.data, items: items.data ?? [] };
  });

export const listOpenComandas = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const supabase = getServerSupabase();
    const { data } = await supabase
      .from("comandas")
      .select("*, clients(name)")
      .eq("tenant_id", tenantId)
      .eq("status", "open")
      .order("created_at", { ascending: false });
    return data ?? [];
  });
