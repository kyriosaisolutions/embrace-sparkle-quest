export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anamnesis_forms: {
        Row: {
          active: boolean
          created_at: string
          fields: Json
          id: string
          name: string
          required: boolean
          service_id: string | null
          tenant_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          fields?: Json
          id?: string
          name: string
          required?: boolean
          service_id?: string | null
          tenant_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          fields?: Json
          id?: string
          name?: string
          required?: boolean
          service_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_forms_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_forms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_responses: {
        Row: {
          appointment_id: string | null
          client_id: string
          consent_given_at: string | null
          created_at: string
          form_id: string
          id: string
          responses: Json
          tenant_id: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          consent_given_at?: string | null
          created_at?: string
          form_id: string
          id?: string
          responses?: Json
          tenant_id: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          consent_given_at?: string | null
          created_at?: string
          form_id?: string
          id?: string
          responses?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_responses_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_responses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string
          client_package_id: string | null
          coupon_id: string | null
          created_at: string | null
          deposit_cents: number
          deposit_paid_at: string | null
          discount_cents: number | null
          ends_at: string
          gift_card_id: string | null
          has_review: boolean | null
          id: string
          notes: string | null
          payment_method: string | null
          professional_id: string
          protocol: string | null
          recurring_appointment_id: string | null
          service_id: string
          starts_at: string
          status: string
          tenant_id: string
          total_cents: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          client_package_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          deposit_cents?: number
          deposit_paid_at?: string | null
          discount_cents?: number | null
          ends_at: string
          gift_card_id?: string | null
          has_review?: boolean | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          professional_id: string
          protocol?: string | null
          recurring_appointment_id?: string | null
          service_id: string
          starts_at: string
          status?: string
          tenant_id: string
          total_cents?: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          client_package_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          deposit_cents?: number
          deposit_paid_at?: string | null
          discount_cents?: number | null
          ends_at?: string
          gift_card_id?: string | null
          has_review?: boolean | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          professional_id?: string
          protocol?: string | null
          recurring_appointment_id?: string | null
          service_id?: string
          starts_at?: string
          status?: string
          tenant_id?: string
          total_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_recurring_appointment_id_fkey"
            columns: ["recurring_appointment_id"]
            isOneToOne: false
            referencedRelation: "recurring_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount_cents: number
          appointment_id: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          payment_method: string | null
          reason: string | null
          session_id: string
          tenant_id: string
        }
        Insert: {
          amount_cents: number
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          payment_method?: string | null
          reason?: string | null
          session_id: string
          tenant_id: string
        }
        Update: {
          amount_cents?: number
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          payment_method?: string | null
          reason?: string | null
          session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_cents: number | null
          difference_cents: number | null
          expected_cents: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string | null
          opening_cents: number
          status: string
          tenant_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_cents?: number | null
          difference_cents?: number | null
          expected_cents?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_cents?: number
          status?: string
          tenant_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_cents?: number | null
          difference_cents?: number | null
          expected_cents?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_cents?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          body: string
          client_id: string
          created_at: string
          id: string
          professional_id: string | null
          tenant_id: string
        }
        Insert: {
          body: string
          client_id: string
          created_at?: string
          id?: string
          professional_id?: string | null
          tenant_id: string
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          professional_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_packages: {
        Row: {
          client_id: string
          expires_at: string | null
          id: string
          package_id: string
          purchased_at: string
          sessions_remaining: number
          status: string
          tenant_id: string
        }
        Insert: {
          client_id: string
          expires_at?: string | null
          id?: string
          package_id: string
          purchased_at?: string
          sessions_remaining: number
          status?: string
          tenant_id: string
        }
        Update: {
          client_id?: string
          expires_at?: string | null
          id?: string
          package_id?: string
          purchased_at?: string
          sessions_remaining?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_photos: {
        Row: {
          appointment_id: string | null
          caption: string | null
          client_id: string
          consent_given_at: string | null
          created_at: string
          id: string
          kind: string
          tenant_id: string
          url: string
        }
        Insert: {
          appointment_id?: string | null
          caption?: string | null
          client_id: string
          consent_given_at?: string | null
          created_at?: string
          id?: string
          kind: string
          tenant_id: string
          url: string
        }
        Update: {
          appointment_id?: string | null
          caption?: string | null
          client_id?: string
          consent_given_at?: string | null
          created_at?: string
          id?: string
          kind?: string
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_photos_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_photos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_photos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          allergies: string | null
          avatar_url: string | null
          birthday: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          gender: string | null
          google_id: string | null
          id: string
          marketing_opt_in: boolean | null
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          allergies?: string | null
          avatar_url?: string | null
          birthday?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          google_id?: string | null
          id?: string
          marketing_opt_in?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          allergies?: string | null
          avatar_url?: string | null
          birthday?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          google_id?: string | null
          id?: string
          marketing_opt_in?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comanda_items: {
        Row: {
          comanda_id: string
          created_at: string
          description: string
          id: string
          kind: string
          product_id: string | null
          professional_id: string | null
          quantity: number
          service_id: string | null
          total_cents: number
          unit_price_cents: number
        }
        Insert: {
          comanda_id: string
          created_at?: string
          description: string
          id?: string
          kind: string
          product_id?: string | null
          professional_id?: string | null
          quantity?: number
          service_id?: string | null
          total_cents: number
          unit_price_cents: number
        }
        Update: {
          comanda_id?: string
          created_at?: string
          description?: string
          id?: string
          kind?: string
          product_id?: string | null
          professional_id?: string | null
          quantity?: number
          service_id?: string | null
          total_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "comanda_items_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          created_at: string
          discount_cents: number
          id: string
          notes: string | null
          opened_by: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          subtotal_cents: number
          tenant_id: string
          total_cents: number
        }
        Insert: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          discount_cents?: number
          id?: string
          notes?: string | null
          opened_by?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal_cents?: number
          tenant_id: string
          total_cents?: number
        }
        Update: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          discount_cents?: number
          id?: string
          notes?: string | null
          opened_by?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal_cents?: number
          tenant_id?: string
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "comandas_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_logs: {
        Row: {
          appointment_id: string
          calculated_at: string | null
          commission_cents: number
          commission_rate: number
          id: string
          paid: boolean | null
          paid_at: string | null
          professional_id: string
          service_price_cents: number
          tenant_id: string
        }
        Insert: {
          appointment_id: string
          calculated_at?: string | null
          commission_cents: number
          commission_rate: number
          id?: string
          paid?: boolean | null
          paid_at?: string | null
          professional_id: string
          service_price_cents: number
          tenant_id: string
        }
        Update: {
          appointment_id?: string
          calculated_at?: string | null
          commission_cents?: number
          commission_rate?: number
          id?: string
          paid?: boolean | null
          paid_at?: string | null
          professional_id?: string
          service_price_cents?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_logs_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          coupon_id: string
          created_at: string
          discount_cents: number
          id: string
        }
        Insert: {
          appointment_id?: string | null
          client_id?: string | null
          coupon_id: string
          created_at?: string
          discount_cents: number
          id?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string | null
          coupon_id?: string
          created_at?: string
          discount_cents?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          id: string
          kind: string
          max_uses: number | null
          min_total_cents: number
          service_id: string | null
          starts_at: string | null
          tenant_id: string
          uses_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          kind: string
          max_uses?: number | null
          min_total_cents?: number
          service_id?: string | null
          starts_at?: string | null
          tenant_id: string
          uses_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          max_uses?: number | null
          min_total_cents?: number
          service_id?: string | null
          starts_at?: string | null
          tenant_id?: string
          uses_count?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_redemptions: {
        Row: {
          amount_cents: number
          appointment_id: string | null
          created_at: string
          gift_card_id: string
          id: string
        }
        Insert: {
          amount_cents: number
          appointment_id?: string | null
          created_at?: string
          gift_card_id: string
          id?: string
        }
        Update: {
          amount_cents?: number
          appointment_id?: string | null
          created_at?: string
          gift_card_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_redemptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_redemptions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          balance_cents: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          initial_value_cents: number
          message: string | null
          purchaser_client_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          balance_cents: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          initial_value_cents: number
          message?: string | null
          purchaser_client_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          balance_cents?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          initial_value_cents?: number
          message?: string | null
          purchaser_client_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_purchaser_client_id_fkey"
            columns: ["purchaser_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_consents: {
        Row: {
          client_id: string
          granted: boolean
          granted_at: string
          id: string
          ip_address: string | null
          purpose: string
          revoked_at: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          client_id: string
          granted: boolean
          granted_at?: string
          id?: string
          ip_address?: string | null
          purpose: string
          revoked_at?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          client_id?: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip_address?: string | null
          purpose?: string
          revoked_at?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_consents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_ledger: {
        Row: {
          appointment_id: string | null
          balance_after: number
          client_id: string
          created_at: string
          delta: number
          expires_at: string | null
          id: string
          reason: string
          tenant_id: string
        }
        Insert: {
          appointment_id?: string | null
          balance_after: number
          client_id: string
          created_at?: string
          delta: number
          expires_at?: string | null
          id?: string
          reason: string
          tenant_id: string
        }
        Update: {
          appointment_id?: string | null
          balance_after?: number
          client_id?: string
          created_at?: string
          delta?: number
          expires_at?: string | null
          id?: string
          reason?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_ledger_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_ledger_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rules: {
        Row: {
          currency_unit_cents: number
          enabled: boolean
          expires_in_days: number | null
          min_redeem_points: number
          points_per_currency_unit: number
          points_to_currency_unit: number
          reward_currency_unit_cents: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          currency_unit_cents?: number
          enabled?: boolean
          expires_in_days?: number | null
          min_redeem_points?: number
          points_per_currency_unit?: number
          points_to_currency_unit?: number
          reward_currency_unit_cents?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          currency_unit_cents?: number
          enabled?: boolean
          expires_in_days?: number | null
          min_redeem_points?: number
          points_per_currency_unit?: number
          points_to_currency_unit?: number
          reward_currency_unit_cents?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          name: string
          recipients_count: number
          scheduled_at: string | null
          segment_filter: Json
          sent_at: string | null
          status: string
          subject: string | null
          tenant_id: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          id?: string
          name: string
          recipients_count?: number
          scheduled_at?: string | null
          segment_filter?: Json
          sent_at?: string | null
          status?: string
          subject?: string | null
          tenant_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          name?: string
          recipients_count?: number
          scheduled_at?: string | null
          segment_filter?: Json
          sent_at?: string | null
          status?: string
          subject?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          price_cents: number
          service_id: string | null
          tenant_id: string
          total_sessions: number
          valid_days: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_cents: number
          service_id?: string | null
          tenant_id: string
          total_sessions: number
          valid_days?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_cents?: number
          service_id?: string | null
          tenant_id?: string
          total_sessions?: number
          valid_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          cost_cents: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_stock_qty: number
          name: string
          price_cents: number
          sku: string | null
          stock_qty: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          cost_cents?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock_qty?: number
          name: string
          price_cents?: number
          sku?: string | null
          stock_qty?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          cost_cents?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock_qty?: number
          name?: string
          price_cents?: number
          sku?: string | null
          stock_qty?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_breaks: {
        Row: {
          created_at: string | null
          description: string | null
          end_at: string
          id: string
          professional_id: string
          start_at: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_at: string
          id?: string
          professional_id: string
          start_at: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_at?: string
          id?: string
          professional_id?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_breaks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_service_commissions: {
        Row: {
          commission_rate: number
          id: string
          professional_id: string
          service_id: string
          tenant_id: string
        }
        Insert: {
          commission_rate: number
          id?: string
          professional_id: string
          service_id: string
          tenant_id: string
        }
        Update: {
          commission_rate?: number
          id?: string
          professional_id?: string
          service_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_service_commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          professional_id: string
          service_id: string
        }
        Insert: {
          professional_id: string
          service_id: string
        }
        Update: {
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_working_hours: {
        Row: {
          close_time: string
          created_at: string | null
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string
          professional_id: string
        }
        Insert: {
          close_time: string
          created_at?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time: string
          professional_id: string
        }
        Update: {
          close_time?: string
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_working_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          access_level: string | null
          avatar_url: string | null
          bio: string | null
          commission_type: string | null
          commission_value: number | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          recommendations_count: number | null
          role: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          avatar_url?: string | null
          bio?: string | null
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          recommendations_count?: number | null
          role?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          avatar_url?: string | null
          bio?: string | null
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          recommendations_count?: number | null
          role?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_appointments: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          day_of_week: number | null
          end_date: string | null
          frequency: string
          id: string
          interval_days: number | null
          next_run_date: string
          professional_id: string | null
          service_id: string
          start_time: string
          tenant_id: string
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          frequency: string
          id?: string
          interval_days?: number | null
          next_run_date: string
          professional_id?: string | null
          service_id: string
          start_time: string
          tenant_id: string
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          frequency?: string
          id?: string
          interval_days?: number | null
          next_run_date?: string
          professional_id?: string | null
          service_id?: string
          start_time?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          professional_id: string
          rating: number
          recommended: boolean | null
          tenant_id: string
        }
        Insert: {
          appointment_id: string
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          professional_id: string
          rating: number
          recommended?: boolean | null
          tenant_id: string
        }
        Update: {
          appointment_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          professional_id?: string
          rating?: number
          recommended?: boolean | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          buffer_time_minutes: number | null
          category: string | null
          created_at: string | null
          deposit_percent: number | null
          description: string | null
          discount_days: number[] | null
          discount_end_date: string | null
          discount_percent: number | null
          discount_start_date: string | null
          duration_minutes: number
          enabled: boolean | null
          id: string
          image_url: string | null
          name: string
          price: number
          price_cents: number | null
          price_from: boolean | null
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          buffer_time_minutes?: number | null
          category?: string | null
          created_at?: string | null
          deposit_percent?: number | null
          description?: string | null
          discount_days?: number[] | null
          discount_end_date?: string | null
          discount_percent?: number | null
          discount_start_date?: string | null
          duration_minutes: number
          enabled?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          price_cents?: number | null
          price_from?: boolean | null
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          buffer_time_minutes?: number | null
          category?: string | null
          created_at?: string | null
          deposit_percent?: number | null
          description?: string | null
          discount_days?: number[] | null
          discount_end_date?: string | null
          discount_percent?: number | null
          discount_start_date?: string | null
          duration_minutes?: number
          enabled?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          price_cents?: number | null
          price_from?: boolean | null
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          cancellation_fee_percent: number | null
          cancellation_min_hours: number | null
          created_at: string | null
          facilities: string[] | null
          id: string
          logo_url: string | null
          name: string
          payment_methods_local: string[] | null
          slot_interval_minutes: number | null
          slug: string
          social_facebook: string | null
          social_instagram: string | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          cancellation_fee_percent?: number | null
          cancellation_min_hours?: number | null
          created_at?: string | null
          facilities?: string[] | null
          id?: string
          logo_url?: string | null
          name: string
          payment_methods_local?: string[] | null
          slot_interval_minutes?: number | null
          slug: string
          social_facebook?: string | null
          social_instagram?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          cancellation_fee_percent?: number | null
          cancellation_min_hours?: number | null
          created_at?: string | null
          facilities?: string[] | null
          id?: string
          logo_url?: string | null
          name?: string
          payment_methods_local?: string[] | null
          slot_interval_minutes?: number | null
          slug?: string
          social_facebook?: string | null
          social_instagram?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      tracked_links: {
        Row: {
          click_count: number
          created_at: string
          destination_url: string
          id: string
          label: string | null
          short_code: string
          tenant_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          click_count?: number
          created_at?: string
          destination_url: string
          id?: string
          label?: string | null
          short_code: string
          tenant_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          click_count?: number
          created_at?: string
          destination_url?: string
          id?: string
          label?: string | null
          short_code?: string
          tenant_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracked_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
          used_at?: string | null
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          desired_date: string | null
          desired_period: string | null
          id: string
          notes: string | null
          professional_id: string | null
          service_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          desired_date?: string | null
          desired_period?: string | null
          id?: string
          notes?: string | null
          professional_id?: string | null
          service_id?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          desired_date?: string | null
          desired_period?: string | null
          id?: string
          notes?: string | null
          professional_id?: string | null
          service_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_protocol: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
