import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

export const getProfessionalWorkingHours = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: professionalId }) => {
    const { data } = await supabase
      .from("professional_working_hours")
      .select("*")
      .eq("professional_id", professionalId)
      .order("day_of_week");
    return data ?? [];
  });

export const upsertWorkingHours = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    professional_id: z.string().uuid(),
    hours: z.array(z.object({
      day_of_week: z.number().int().min(0).max(6),
      open: z.string().nullable(),
      close: z.string().nullable(),
      closed: z.boolean(),
    })),
  }))
  .handler(async ({ data }) => {
    await supabase.from("professional_working_hours").delete().eq("professional_id", data.professional_id);
    const rows = data.hours.map(h => ({
      professional_id: data.professional_id,
      day_of_week: h.day_of_week,
      open_time: h.open ?? "00:00",
      close_time: h.close ?? "00:00",
      is_closed: h.closed,
    }));
    const { error } = await supabase.from("professional_working_hours").insert(rows);
    if (error) throw error;
    return { ok: true };
  });

export const listBreaks = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: professionalId }) => {
    const { data } = await supabase
      .from("professional_breaks")
      .select("*")
      .eq("professional_id", professionalId)
      .order("start_at");
    return data ?? [];
  });

export const addBreak = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    professional_id: z.string().uuid(),
    starts_at: z.string(),
    ends_at: z.string(),
    reason: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("professional_breaks").insert({
      professional_id: data.professional_id,
      start_at: data.starts_at,
      end_at: data.ends_at,
      description: data.reason,
    });
    if (error) throw error;
    return { ok: true };
  });

export const deleteBreak = createServerFn({ method: "POST" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: id }) => {
    const { error } = await supabase.from("professional_breaks").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const rescheduleAppointment = createServerFn({ method: "POST" })
  .inputValidator(z.object({ appointment_id: z.string().uuid(), new_starts_at: z.string(), new_ends_at: z.string() }))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("appointments")
      .update({ starts_at: data.new_starts_at, ends_at: data.new_ends_at })
      .eq("id", data.appointment_id);
    if (error) throw error;
    return { ok: true };
  });
