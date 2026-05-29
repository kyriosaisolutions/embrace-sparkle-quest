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
      appointments: {
        Row: {
          client_id: string
          created_at: string | null
          deposit_cents: number
          deposit_paid_at: string | null
          ends_at: string
          has_review: boolean | null
          id: string
          notes: string | null
          payment_method: string | null
          professional_id: string
          protocol: string | null
          service_id: string
          starts_at: string
          status: string
          tenant_id: string
          total_cents: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deposit_cents?: number
          deposit_paid_at?: string | null
          ends_at: string
          has_review?: boolean | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          professional_id: string
          protocol?: string | null
          service_id: string
          starts_at: string
          status?: string
          tenant_id: string
          total_cents?: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          deposit_cents?: number
          deposit_paid_at?: string | null
          ends_at?: string
          has_review?: boolean | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          professional_id?: string
          protocol?: string | null
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
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
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
      clients: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          google_id: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          google_id?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          google_id?: string | null
          id?: string
          name?: string
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
