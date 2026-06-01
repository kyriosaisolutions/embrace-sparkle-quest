import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createAppointment = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    client_id: z.string().uuid().optional(),
    professional_id: z.string().uuid(),
    service_id: z.string().uuid(),
    starts_at: z.string(),
    ends_at: z.string(),
    total_cents: z.number(),
    payment_method: z.string(),
    client_data: z.object({
      name: z.string(),
      phone: z.string()
    }).optional(),
    coupon_id: z.string().uuid().optional().nullable(),
    gift_card_id: z.string().uuid().optional().nullable(),
    gift_card_amount_cents: z.number().int().optional().nullable(),
    client_package_id: z.string().uuid().optional().nullable(),
    discount_cents: z.number().int().optional().nullable(),
  }))
  .handler(async ({ data }) => {
    let clientId = data.client_id;

    // If guest, create or find client by phone
    if (!clientId && data.client_data) {
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("phone", data.client_data.phone)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            tenant_id: data.tenant_id,
            name: data.client_data.name,
            phone: data.client_data.phone
          })
          .select("id")
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }
    }

    if (!clientId) throw new Error("Client identification failed");

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        tenant_id: data.tenant_id,
        client_id: clientId,
        professional_id: data.professional_id,
        service_id: data.service_id,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
        total_cents: data.total_cents,
        payment_method: data.payment_method,
        status: data.payment_method === 'pix' ? 'scheduled' : 'confirmed',
        coupon_id: data.coupon_id ?? null,
        gift_card_id: data.gift_card_id ?? null,
        client_package_id: data.client_package_id ?? null,
        discount_cents: data.discount_cents ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }

    // Coupon redemption
    if (data.coupon_id) {
      try {
        await supabase.from("coupon_redemptions").insert({
          coupon_id: data.coupon_id,
          appointment_id: appointment.id,
          client_id: clientId,
          discount_cents: data.discount_cents ?? 0,
        });
        const { data: c } = await supabase.from("coupons").select("uses_count").eq("id", data.coupon_id).single();
        await supabase.from("coupons").update({ uses_count: (c?.uses_count ?? 0) + 1 }).eq("id", data.coupon_id);
        console.info("coupon_redeemed", { tenant: data.tenant_id, coupon_id: data.coupon_id });
      } catch (e) {
        console.error("coupon redemption failed", e);
      }
    }

    // Gift card redemption
    if (data.gift_card_id && data.gift_card_amount_cents && data.gift_card_amount_cents > 0) {
      try {
        const { data: gc } = await supabase.from("gift_cards").select("*").eq("id", data.gift_card_id).single();
        if (gc) {
          const new_balance = Math.max(0, gc.balance_cents - data.gift_card_amount_cents);
          const status = new_balance === 0 ? "redeemed" : "active";
          await supabase.from("gift_cards").update({ balance_cents: new_balance, status }).eq("id", data.gift_card_id);
          await supabase.from("gift_card_redemptions").insert({
            gift_card_id: data.gift_card_id,
            appointment_id: appointment.id,
            amount_cents: data.gift_card_amount_cents,
          });
          console.info("gift_card_redeemed", { tenant: data.tenant_id, gift_card_id: data.gift_card_id, amount: data.gift_card_amount_cents });
        }
      } catch (e) {
        console.error("gift card redemption failed", e);
      }
    }

    // Package session consumption
    if (data.client_package_id) {
      try {
        const { data: cp } = await supabase.from("client_packages").select("*").eq("id", data.client_package_id).single();
        if (cp && cp.sessions_remaining > 0) {
          const remaining = cp.sessions_remaining - 1;
          const status = remaining === 0 ? "exhausted" : "active";
          await supabase.from("client_packages").update({ sessions_remaining: remaining, status }).eq("id", data.client_package_id);
          console.info("package_consumed", { tenant: data.tenant_id, client_package_id: data.client_package_id, remaining });
        }
      } catch (e) {
        console.error("package consumption failed", e);
      }
    }

    return appointment;
  });

// ---- getAvailableSlots ----

type Range = { start: number; end: number };

function parseTimeOnDate(date: Date, hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m ?? 0, 0, 0);
  return d.getTime();
}

function subtractRanges(windows: Range[], blocks: Range[]): Range[] {
  let result = windows.slice();
  for (const b of blocks) {
    const next: Range[] = [];
    for (const w of result) {
      if (b.end <= w.start || b.start >= w.end) {
        next.push(w);
        continue;
      }
      if (b.start > w.start) next.push({ start: w.start, end: Math.min(b.start, w.end) });
      if (b.end < w.end) next.push({ start: Math.max(b.end, w.start), end: w.end });
    }
    result = next.filter(r => r.end > r.start);
  }
  return result;
}

export const getAvailableSlots = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    service_id: z.string().uuid(),
    professional_id: z.string().uuid(),
    date: z.string(),
  }))
  .handler(async ({ data }) => {
    // 1. Service
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", data.service_id)
      .single();
    if (svcErr || !service) throw svcErr ?? new Error("Service not found");
    const durationMs = service.duration_minutes * 60_000;

    // 2. Tenant
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("slot_interval_minutes, working_hours, cancellation_hours")
      .eq("id", data.tenant_id)
      .single();
    if (tErr || !tenant) throw tErr ?? new Error("Tenant not found");
    const slotIntervalMin = tenant.slot_interval_minutes ?? 30;
    const cancellationHours = tenant.cancellation_hours ?? 2;
    const slotIntervalMs = slotIntervalMin * 60_000;

    // Parse date as local midnight
    const [Y, M, D] = data.date.split("-").map(Number);
    const dayDate = new Date(Y, M - 1, D, 0, 0, 0, 0);
    const dayOfWeek = dayDate.getDay();

    // 3. Working hours: professional override > tenant fallback
    const { data: pwhRows } = await supabase
      .from("professional_working_hours")
      .select("starts_at, ends_at, closed")
      .eq("professional_id", data.professional_id)
      .eq("day_of_week", dayOfWeek);

    let dayWindow: Range | null = null;
    if (pwhRows && pwhRows.length > 0) {
      const pwh = pwhRows[0];
      if (!pwh.closed && pwh.starts_at && pwh.ends_at) {
        dayWindow = {
          start: parseTimeOnDate(dayDate, String(pwh.starts_at).slice(0, 5)),
          end: parseTimeOnDate(dayDate, String(pwh.ends_at).slice(0, 5)),
        };
      }
    } else {
      const wh = (tenant.working_hours as any) ?? {};
      const cfg = wh[String(dayOfWeek)];
      if (cfg && !cfg.closed && cfg.open && cfg.close) {
        dayWindow = {
          start: parseTimeOnDate(dayDate, cfg.open),
          end: parseTimeOnDate(dayDate, cfg.close),
        };
      }
    }

    if (!dayWindow) return [] as string[];

    // 4. Breaks overlapping day
    const dayStartIso = new Date(dayDate).toISOString();
    const dayEndIso = new Date(dayDate.getTime() + 86_400_000).toISOString();
    const { data: breaks } = await supabase
      .from("professional_breaks")
      .select("starts_at, ends_at")
      .eq("professional_id", data.professional_id)
      .lt("starts_at", dayEndIso)
      .gt("ends_at", dayStartIso);

    const breakRanges: Range[] = (breaks ?? []).map(b => ({
      start: new Date(b.starts_at).getTime(),
      end: new Date(b.ends_at).getTime(),
    }));

    // 5. Existing appointments
    const { data: appts } = await supabase
      .from("appointments")
      .select("starts_at, ends_at, status")
      .eq("professional_id", data.professional_id)
      .neq("status", "cancelled")
      .lt("starts_at", dayEndIso)
      .gt("ends_at", dayStartIso);

    const apptRanges: Range[] = (appts ?? []).map(a => ({
      start: new Date(a.starts_at).getTime(),
      end: new Date(a.ends_at).getTime(),
    }));

    // 6. Subtract blocks from day window
    const freeWindows = subtractRanges([dayWindow], [...breakRanges, ...apptRanges]);

    // 7. Generate slots
    const minStart = Date.now() + cancellationHours * 3600_000;
    const slots: string[] = [];
    for (const w of freeWindows) {
      // Align start to slot interval relative to dayWindow.start
      let cursor = w.start;
      // align to slotInterval grid based on dayWindow.start
      const offset = (cursor - dayWindow.start) % slotIntervalMs;
      if (offset !== 0) cursor = cursor + (slotIntervalMs - offset);
      while (cursor + durationMs <= w.end) {
        if (cursor >= minStart) {
          slots.push(new Date(cursor).toISOString());
        }
        cursor += slotIntervalMs;
      }
    }

    slots.sort();
    return slots;
  });
