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
    }).optional()
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
        status: data.payment_method === 'pix' ? 'scheduled' : 'confirmed'
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }

    return appointment;
  });
