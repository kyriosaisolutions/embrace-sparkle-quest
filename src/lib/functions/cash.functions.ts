import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase.server";


export const getCurrentSession = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const supabase = getServerSupabase();
    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

export const openCashSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    opened_by: z.string().uuid().optional(),
    opening_cents: z.number().int().min(0),
    notes: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: existing } = await supabase
      .from("cash_sessions")
      .select("id")
      .eq("tenant_id", data.tenant_id)
      .eq("status", "open")
      .maybeSingle();
    if (existing) throw new Error("Já existe um caixa aberto");
    const { data: row, error } = await supabase.from("cash_sessions").insert(data).select("*").single();
    if (error) throw error;
    return row;
  });

export const closeCashSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    session_id: z.string().uuid(),
    closed_by: z.string().uuid().optional(),
    closing_cents: z.number().int().min(0),
    notes: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: sess } = await supabase.from("cash_sessions").select("*").eq("id", data.session_id).single();
    if (!sess) throw new Error("Sessão não encontrada");
    const { data: moves } = await supabase.from("cash_movements").select("kind, amount_cents").eq("session_id", data.session_id);
    let expected = sess.opening_cents;
    for (const m of moves ?? []) {
      if (m.kind === "sale" || m.kind === "reinforcement") expected += m.amount_cents;
      else expected -= m.amount_cents;
    }
    const diff = data.closing_cents - expected;
    const { data: row, error } = await supabase
      .from("cash_sessions")
      .update({
        status: "closed",
        closed_by: data.closed_by,
        closing_cents: data.closing_cents,
        expected_cents: expected,
        difference_cents: diff,
        closed_at: new Date().toISOString(),
        notes: data.notes,
      })
      .eq("id", data.session_id)
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const addCashMovement = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    session_id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    kind: z.enum(["sale","withdraw","reinforcement","refund","expense"]),
    amount_cents: z.number().int().min(1),
    payment_method: z.string().optional(),
    reason: z.string().optional(),
    appointment_id: z.string().uuid().optional(),
    created_by: z.string().uuid().optional(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: row, error } = await supabase.from("cash_movements").insert(data).select("*").single();
    if (error) throw error;
    return row;
  });

export const listSessionMovements = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: sessionId }) => {
    const supabase = getServerSupabase();
    const { data } = await supabase
      .from("cash_movements")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });
