import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

export const exportClientData = createServerFn({ method: "GET" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: clientId }) => {
    const [client, appointments, reviews, packages, consents, photos, responses, points] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("appointments").select("*").eq("client_id", clientId),
      supabase.from("reviews").select("*").eq("client_id", clientId),
      supabase.from("client_packages").select("*").eq("client_id", clientId),
      supabase.from("lgpd_consents").select("*").eq("client_id", clientId),
      supabase.from("client_photos").select("*").eq("client_id", clientId),
      supabase.from("anamnesis_responses").select("*").eq("client_id", clientId),
      supabase.from("loyalty_ledger").select("*").eq("client_id", clientId),
    ]);
    return {
      exported_at: new Date().toISOString(),
      client: client.data,
      appointments: appointments.data ?? [],
      reviews: reviews.data ?? [],
      packages: packages.data ?? [],
      consents: consents.data ?? [],
      photos: photos.data ?? [],
      anamnesis_responses: responses.data ?? [],
      loyalty_ledger: points.data ?? [],
    };
  });

export const recordConsent = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    client_id: z.string().uuid(),
    tenant_id: z.string().uuid().optional().nullable(),
    purpose: z.enum(["transactional","marketing","image","health_data","third_party"]),
    granted: z.boolean(),
  }))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("lgpd_consents").insert(data);
    if (error) throw error;
    return { ok: true };
  });

export const revokeConsent = createServerFn({ method: "POST" })
  .inputValidator(z.object({ client_id: z.string().uuid(), purpose: z.string() }))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("lgpd_consents")
      .update({ revoked_at: new Date().toISOString(), granted: false })
      .eq("client_id", data.client_id)
      .eq("purpose", data.purpose)
      .is("revoked_at", null);
    if (error) throw error;
    return { ok: true };
  });

export const requestAccountDeletion = createServerFn({ method: "POST" })
  .inputValidator(z.string().uuid())
  .handler(async ({ data: clientId }) => {
    // Anonymize rather than delete to preserve fiscal/audit records.
    const anon = `anon-${clientId.slice(0, 8)}`;
    const { error } = await supabase
      .from("clients")
      .update({
        name: "Cliente removido",
        email: `${anon}@deleted.local`,
        phone: null,
        cpf: null,
        notes: null,
        allergies: null,
        birthday: null,
        marketing_opt_in: false,
        google_id: null,
      })
      .eq("id", clientId);
    if (error) throw error;
    await supabase.from("client_photos").delete().eq("client_id", clientId);
    await supabase.from("anamnesis_responses").delete().eq("client_id", clientId);
    await supabase.from("client_notes").delete().eq("client_id", clientId);
    return { ok: true };
  });
