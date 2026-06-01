import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

export const listWaitlist = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const { data, error } = await supabase
      .from("waitlist_entries")
      .select("*, services(name), professionals(name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const createWaitlistEntry = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    client_id: z.string().uuid().optional().nullable(),
    client_name: z.string().min(1),
    client_phone: z.string().optional().nullable(),
    service_id: z.string().uuid().optional().nullable(),
    professional_id: z.string().uuid().optional().nullable(),
    desired_date: z.string().optional().nullable(),
    desired_period: z.enum(["morning","afternoon","evening","any"]).default("any"),
    notes: z.string().optional().nullable(),
  }))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabase
      .from("waitlist_entries")
      .insert(data)
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const updateWaitlistStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), status: z.enum(["open","notified","converted","cancelled"]) }))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("waitlist_entries").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
