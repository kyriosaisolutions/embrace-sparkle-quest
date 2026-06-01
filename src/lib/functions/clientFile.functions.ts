import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase.server";


export const getClientFile = createServerFn({ method: "GET" })
  .inputValidator(z.object({ tenant_id: z.string().uuid(), client_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const [client, appointments, notes, photos, responses] = await Promise.all([
      supabase.from("clients").select("*").eq("id", data.client_id).single(),
      supabase.from("appointments").select("*, services(name)").eq("client_id", data.client_id).eq("tenant_id", data.tenant_id).order("starts_at", { ascending: false }).limit(30),
      supabase.from("client_notes").select("*, professionals(name)").eq("client_id", data.client_id).eq("tenant_id", data.tenant_id).order("created_at", { ascending: false }),
      supabase.from("client_photos").select("*").eq("client_id", data.client_id).eq("tenant_id", data.tenant_id).order("created_at", { ascending: false }),
      supabase.from("anamnesis_responses").select("*, anamnesis_forms(name)").eq("client_id", data.client_id).eq("tenant_id", data.tenant_id).order("created_at", { ascending: false }),
    ]);
    return {
      client: client.data,
      appointments: appointments.data ?? [],
      notes: notes.data ?? [],
      photos: photos.data ?? [],
      responses: responses.data ?? [],
    };
  });

export const updateClient = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().uuid(),
    name: z.string().optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    birthday: z.string().optional().nullable(),
    cpf: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    allergies: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    marketing_opt_in: z.boolean().optional(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { id, ...patch } = data;
    const { error } = await supabase.from("clients").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const addClientNote = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    client_id: z.string().uuid(),
    professional_id: z.string().uuid().optional().nullable(),
    body: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: row, error } = await supabase.from("client_notes").insert(data).select("*").single();
    if (error) throw error;
    return row;
  });

export const addClientPhoto = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    client_id: z.string().uuid(),
    appointment_id: z.string().uuid().optional().nullable(),
    kind: z.enum(["before","after","reference","other"]),
    url: z.string().url(),
    caption: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { error } = await supabase.from("client_photos").insert({ ...data, consent_given_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });

export const listAnamnesisForms = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: tenantId }) => {
    const supabase = getServerSupabase();
    const { data } = await supabase.from("anamnesis_forms").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    return data ?? [];
  });

export const upsertAnamnesisForm = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().uuid().optional(),
    tenant_id: z.string().uuid(),
    name: z.string().min(1),
    fields: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(["text","textarea","number","boolean","select"]),
      options: z.array(z.string()).optional(),
      required: z.boolean().optional(),
    })),
    service_id: z.string().uuid().optional().nullable(),
    required: z.boolean().default(false),
    active: z.boolean().default(true),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { data: row, error } = await supabase.from("anamnesis_forms").upsert(data).select("*").single();
    if (error) throw error;
    return row;
  });

export const submitAnamnesisResponse = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tenant_id: z.string().uuid(),
    form_id: z.string().uuid(),
    client_id: z.string().uuid(),
    appointment_id: z.string().uuid().optional().nullable(),
    responses: z.record(z.string(), z.any()),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerSupabase();
    const { error } = await supabase.from("anamnesis_responses").insert({
      ...data,
      consent_given_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { ok: true };
  });
