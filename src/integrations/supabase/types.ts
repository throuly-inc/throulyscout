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
      buyer_questionnaires: {
        Row: {
          bedrooms_min: number | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          id: string
          preferred_cities: string[] | null
          preferred_states: string[] | null
          property_type: string | null
          timeline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          id?: string
          preferred_cities?: string[] | null
          preferred_states?: string[] | null
          property_type?: string | null
          timeline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          id?: string
          preferred_cities?: string[] | null
          preferred_states?: string[] | null
          property_type?: string | null
          timeline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_questionnaires_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_waitlist: {
        Row: {
          created_at: string
          desired_tier: string
          email: string
          id: string
          normalized_email: string | null
        }
        Insert: {
          created_at?: string
          desired_tier: string
          email: string
          id?: string
          normalized_email?: string | null
        }
        Update: {
          created_at?: string
          desired_tier?: string
          email?: string
          id?: string
          normalized_email?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_deactivated: boolean
          notification_preferences: Json
          onboarding_complete: boolean
          phone: string | null
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_deactivated?: boolean
          notification_preferences?: Json
          onboarding_complete?: boolean
          phone?: string | null
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_deactivated?: boolean
          notification_preferences?: Json
          onboarding_complete?: boolean
          phone?: string | null
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          asking_price: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          listing_type: string | null
          owner_id: string
          photos: string[] | null
          sqft: number | null
          state: string | null
          status: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address: string
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_type?: string | null
          owner_id: string
          photos?: string[] | null
          sqft?: number | null
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_type?: string | null
          owner_id?: string
          photos?: string[] | null
          sqft?: number | null
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_analyses: {
        Row: {
          assistance_programs: Json | null
          bathrooms: number | null
          bedrooms: number | null
          cash_to_close: number | null
          city: string | null
          closing_costs: number | null
          created_at: string
          down_payment_percent: number | null
          dti_ratio: number | null
          external_resources: Json | null
          id: string
          listing_url: string
          monthly_hoa: number | null
          monthly_insurance: number | null
          monthly_mortgage: number | null
          monthly_pmi: number | null
          monthly_property_tax: number | null
          property_address: string | null
          property_price: number | null
          property_type: string | null
          qualifies: boolean | null
          raw_property_data: Json | null
          square_feet: number | null
          state: string | null
          total_monthly_payment: number | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          assistance_programs?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          cash_to_close?: number | null
          city?: string | null
          closing_costs?: number | null
          created_at?: string
          down_payment_percent?: number | null
          dti_ratio?: number | null
          external_resources?: Json | null
          id?: string
          listing_url: string
          monthly_hoa?: number | null
          monthly_insurance?: number | null
          monthly_mortgage?: number | null
          monthly_pmi?: number | null
          monthly_property_tax?: number | null
          property_address?: string | null
          property_price?: number | null
          property_type?: string | null
          qualifies?: boolean | null
          raw_property_data?: Json | null
          square_feet?: number | null
          state?: string | null
          total_monthly_payment?: number | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          assistance_programs?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          cash_to_close?: number | null
          city?: string | null
          closing_costs?: number | null
          created_at?: string
          down_payment_percent?: number | null
          dti_ratio?: number | null
          external_resources?: Json | null
          id?: string
          listing_url?: string
          monthly_hoa?: number | null
          monthly_insurance?: number | null
          monthly_mortgage?: number | null
          monthly_pmi?: number | null
          monthly_property_tax?: number | null
          property_address?: string | null
          property_price?: number | null
          property_type?: string | null
          qualifies?: boolean | null
          raw_property_data?: Json | null
          square_feet?: number | null
          state?: string | null
          total_monthly_payment?: number | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      roadmap_progress: {
        Row: {
          created_at: string
          employment_type: string | null
          readiness_meta: Json
          tasks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employment_type?: string | null
          readiness_meta?: Json
          tasks?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employment_type?: string | null
          readiness_meta?: Json
          tasks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_results: {
        Row: {
          created_at: string
          down_payment_percent: number
          dti_ratio: number | null
          hoa_monthly: number | null
          home_price: number
          id: string
          monthly_payment: number | null
          notes: string | null
          qualifies: boolean | null
          state: string
          total_cash_needed: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          down_payment_percent: number
          dti_ratio?: number | null
          hoa_monthly?: number | null
          home_price: number
          id?: string
          monthly_payment?: number | null
          notes?: string | null
          qualifies?: boolean | null
          state: string
          total_cash_needed?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          down_payment_percent?: number
          dti_ratio?: number | null
          hoa_monthly?: number | null
          home_price?: number
          id?: string
          monthly_payment?: number | null
          notes?: string | null
          qualifies?: boolean | null
          state?: string
          total_cash_needed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      saved_scenarios: {
        Row: {
          created_at: string
          id: string
          inputs: Json
          results: Json
          scenario_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inputs?: Json
          results?: Json
          scenario_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inputs?: Json
          results?: Json
          scenario_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          search_name: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          search_name?: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          search_name?: string
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_plans: {
        Row: {
          created_at: string
          current_savings: number
          expenses: Json
          goal: number
          monthly_income: number
          target_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_savings?: number
          expenses?: Json
          goal?: number
          monthly_income?: number
          target_months?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_savings?: number
          expenses?: Json
          goal?: number
          monthly_income?: number
          target_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategy_suggestions: {
        Row: {
          created_at: string
          id: string
          note: string | null
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          count: number
          feature: string
          id: string
          period_yyyymm: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          feature: string
          id?: string
          period_yyyymm: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          feature?: string
          id?: string
          period_yyyymm?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_financial_profiles: {
        Row: {
          created_at: string
          credit_score: number | null
          id: string
          max_price: number | null
          min_price: number | null
          monthly_expenses: number | null
          preferred_states: string[] | null
          property_types: string[] | null
          savings: number | null
          total_debt: number | null
          updated_at: string
          user_id: string
          yearly_income: number | null
        }
        Insert: {
          created_at?: string
          credit_score?: number | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          monthly_expenses?: number | null
          preferred_states?: string[] | null
          property_types?: string[] | null
          savings?: number | null
          total_debt?: number | null
          updated_at?: string
          user_id: string
          yearly_income?: number | null
        }
        Update: {
          created_at?: string
          credit_score?: number | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          monthly_expenses?: number | null
          preferred_states?: string[] | null
          property_types?: string[] | null
          savings?: number | null
          total_debt?: number | null
          updated_at?: string
          user_id?: string
          yearly_income?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          normalized_email: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          normalized_email?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          normalized_email?: string | null
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_properties: {
        Row: {
          address: string | null
          asking_price: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string | null
          listing_type: string | null
          photos: string[] | null
          sqft: number | null
          state: string | null
          status: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          listing_type?: string | null
          photos?: string[] | null
          sqft?: number | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          listing_type?: string | null
          photos?: string[] | null
          sqft?: number | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      public_property_listings: {
        Row: {
          asking_price: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string | null
          listing_type: string | null
          photos: string[] | null
          sqft: number | null
          state: string | null
          status: string | null
          zip: string | null
        }
        Insert: {
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          listing_type?: string | null
          photos?: string[] | null
          sqft?: number | null
          state?: string | null
          status?: string | null
          zip?: string | null
        }
        Update: {
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          listing_type?: string | null
          photos?: string[] | null
          sqft?: number | null
          state?: string | null
          status?: string | null
          zip?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_grant_role: {
        Args: { _reason?: string; _role: string; _target: string }
        Returns: Json
      }
      admin_revoke_role: {
        Args: { _reason?: string; _role: string; _target: string }
        Returns: Json
      }
      admin_set_subscription_tier: {
        Args: { _new_tier: string; _reason?: string; _target: string }
        Returns: Json
      }
      consume_usage: { Args: { _feature: string }; Returns: Json }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "premium" | "agent" | "broker" | "client"
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
    Enums: {
      app_role: ["admin", "user", "premium", "agent", "broker", "client"],
    },
  },
} as const
