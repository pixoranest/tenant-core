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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          call_log_id: string | null
          client_id: string
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          status: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          call_log_id?: string | null
          client_id: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          call_log_id?: string | null
          client_id?: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_call_log_id_fkey"
            columns: ["call_log_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          agent_id: string | null
          archived: boolean | null
          archived_at: string | null
          call_id: string
          call_timestamp: string
          caller_phone: string | null
          client_id: string
          cost: number | null
          created_at: string | null
          data_collected: Json | null
          direction: string | null
          duration: number | null
          execution_status: string | null
          external_provider: string | null
          id: string
          last_played_at: string | null
          notes: string | null
          outcome: string | null
          playback_count: number | null
          recording_url: string | null
          status: string | null
          tags: string[] | null
          transcript_text: string | null
          transcript_url: string | null
        }
        Insert: {
          agent_id?: string | null
          archived?: boolean | null
          archived_at?: string | null
          call_id: string
          call_timestamp: string
          caller_phone?: string | null
          client_id: string
          cost?: number | null
          created_at?: string | null
          data_collected?: Json | null
          direction?: string | null
          duration?: number | null
          execution_status?: string | null
          external_provider?: string | null
          id?: string
          last_played_at?: string | null
          notes?: string | null
          outcome?: string | null
          playback_count?: number | null
          recording_url?: string | null
          status?: string | null
          tags?: string[] | null
          transcript_text?: string | null
          transcript_url?: string | null
        }
        Update: {
          agent_id?: string | null
          archived?: boolean | null
          archived_at?: string | null
          call_id?: string
          call_timestamp?: string
          caller_phone?: string | null
          client_id?: string
          cost?: number | null
          created_at?: string | null
          data_collected?: Json | null
          direction?: string | null
          duration?: number | null
          execution_status?: string | null
          external_provider?: string | null
          id?: string
          last_played_at?: string | null
          notes?: string | null
          outcome?: string | null
          playback_count?: number | null
          recording_url?: string | null
          status?: string | null
          tags?: string[] | null
          transcript_text?: string | null
          transcript_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "voice_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_agent_assignments: {
        Row: {
          agent_id: string
          assigned_at: string | null
          client_id: string
          id: string
          phone_number: string | null
          status: string | null
        }
        Insert: {
          agent_id: string
          assigned_at?: string | null
          client_id: string
          id?: string
          phone_number?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string
          assigned_at?: string | null
          client_id?: string
          id?: string
          phone_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_agent_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "voice_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_agent_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_features: {
        Row: {
          analytics_dashboard: boolean | null
          api_access: boolean | null
          calendar_integration: boolean | null
          call_recordings_access: boolean | null
          call_transcripts: boolean | null
          client_id: string
          created_at: string | null
          custom_branding: boolean | null
          data_export: boolean | null
          id: string
          max_concurrent_calls: number | null
          realtime_monitoring: boolean | null
          updated_at: string | null
        }
        Insert: {
          analytics_dashboard?: boolean | null
          api_access?: boolean | null
          calendar_integration?: boolean | null
          call_recordings_access?: boolean | null
          call_transcripts?: boolean | null
          client_id: string
          created_at?: string | null
          custom_branding?: boolean | null
          data_export?: boolean | null
          id?: string
          max_concurrent_calls?: number | null
          realtime_monitoring?: boolean | null
          updated_at?: string | null
        }
        Update: {
          analytics_dashboard?: boolean | null
          api_access?: boolean | null
          calendar_integration?: boolean | null
          call_recordings_access?: boolean | null
          call_transcripts?: boolean | null
          client_id?: string
          created_at?: string | null
          custom_branding?: boolean | null
          data_export?: boolean | null
          id?: string
          max_concurrent_calls?: number | null
          realtime_monitoring?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_features_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_integrations: {
        Row: {
          client_id: string
          config: Json
          created_at: string | null
          id: string
          integration_type: string
          last_sync: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          config?: Json
          created_at?: string | null
          id?: string
          integration_type: string
          last_sync?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          config?: Json
          created_at?: string | null
          id?: string
          integration_type?: string
          last_sync?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_integrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          client_id: string
          created_at: string | null
          email_call_failure: boolean | null
          email_daily_summary: boolean | null
          email_low_balance: boolean | null
          email_weekly_report: boolean | null
          id: string
          sms_notifications: boolean | null
          updated_at: string | null
          webhook_notifications: boolean | null
          webhook_url: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          email_call_failure?: boolean | null
          email_daily_summary?: boolean | null
          email_low_balance?: boolean | null
          email_weekly_report?: boolean | null
          id?: string
          sms_notifications?: boolean | null
          updated_at?: string | null
          webhook_notifications?: boolean | null
          webhook_url?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          email_call_failure?: boolean | null
          email_daily_summary?: boolean | null
          email_low_balance?: boolean | null
          email_weekly_report?: boolean | null
          id?: string
          sms_notifications?: boolean | null
          updated_at?: string | null
          webhook_notifications?: boolean | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_plan: string | null
          business_type: string | null
          contact_name: string | null
          created_at: string
          email: string
          id: string
          monthly_allowance: number | null
          name: string
          overage_rate: number | null
          phone: string | null
          rate_per_minute: number | null
          status: string
          timezone: string | null
          trial_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          billing_plan?: string | null
          business_type?: string | null
          contact_name?: string | null
          created_at?: string
          email: string
          id?: string
          monthly_allowance?: number | null
          name: string
          overage_rate?: number | null
          phone?: string | null
          rate_per_minute?: number | null
          status?: string
          timezone?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_plan?: string | null
          business_type?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string
          id?: string
          monthly_allowance?: number | null
          name?: string
          overage_rate?: number | null
          phone?: string | null
          rate_per_minute?: number | null
          status?: string
          timezone?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          name: string | null
          phone: string | null
          role: string
          two_factor_enabled: boolean
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          last_login?: string | null
          name?: string | null
          phone?: string | null
          role?: string
          two_factor_enabled?: boolean
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string | null
          phone?: string | null
          role?: string
          two_factor_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_agents: {
        Row: {
          created_at: string | null
          description: string | null
          greeting_message: string | null
          id: string
          is_active: boolean | null
          name: string
          omnidimension_agent_id: string | null
          system_prompt: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          omnidimension_agent_id?: string | null
          system_prompt?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          omnidimension_agent_id?: string | null
          system_prompt?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      daily_call_stats: {
        Row: {
          avg_duration_seconds: number | null
          call_date: string | null
          client_id: string | null
          completed_calls: number | null
          failed_calls: number | null
          missed_calls: number | null
          total_calls: number | null
          total_cost: number | null
          total_duration_seconds: number | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      archive_call_log: { Args: { call_uuid: string }; Returns: undefined }
      calculate_call_cost: {
        Args: { duration_seconds: number; rate_per_minute: number }
        Returns: number
      }
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
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
