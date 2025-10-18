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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_stats: {
        Row: {
          active_users_today: number
          id: string
          total_code_runs: number
          total_lines_executed: number
          updated_at: string
        }
        Insert: {
          active_users_today?: number
          id?: string
          total_code_runs?: number
          total_lines_executed?: number
          updated_at?: string
        }
        Update: {
          active_users_today?: number
          id?: string
          total_code_runs?: number
          total_lines_executed?: number
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          page_context: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          subject: string
          type: Database["public"]["Enums"]["feedback_type"]
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          page_context?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          subject: string
          type: Database["public"]["Enums"]["feedback_type"]
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          page_context?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          subject?: string
          type?: Database["public"]["Enums"]["feedback_type"]
          user_agent?: string | null
        }
        Relationships: []
      }
      labs_history: {
        Row: {
          completed: boolean
          difficulty: string
          generated_at: string
          id: string
          lab_content: string
          lab_theme: string
          lab_title: string
          test_passed: boolean
          user_id: string
        }
        Insert: {
          completed?: boolean
          difficulty: string
          generated_at?: string
          id?: string
          lab_content: string
          lab_theme: string
          lab_title: string
          test_passed?: boolean
          user_id: string
        }
        Update: {
          completed?: boolean
          difficulty?: string
          generated_at?: string
          id?: string
          lab_content?: string
          lab_theme?: string
          lab_title?: string
          test_passed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      labs_progress: {
        Row: {
          completed_count: number
          created_at: string
          difficulty: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_count?: number
          created_at?: string
          difficulty: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_count?: number
          created_at?: string
          difficulty?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recent_activity: {
        Row: {
          activity_description: string
          activity_type: string
          created_at: string
          id: string
          language: string | null
        }
        Insert: {
          activity_description: string
          activity_type: string
          created_at?: string
          id?: string
          language?: string | null
        }
        Update: {
          activity_description?: string
          activity_type?: string
          created_at?: string
          id?: string
          language?: string | null
        }
        Relationships: []
      }
      shared_code: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          file_name: string | null
          id: string
          language: string
          short_id: string
          user_id: string | null
          view_count: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          file_name?: string | null
          id?: string
          language: string
          short_id: string
          user_id?: string | null
          view_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          file_name?: string | null
          id?: string
          language?: string
          short_id?: string
          user_id?: string | null
          view_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_recent_activity: {
        Args: {
          activity_description: string
          activity_type: string
          language: string
        }
        Returns: undefined
      }
      increment_stats: {
        Args: { code_runs: number; lines: number }
        Returns: undefined
      }
    }
    Enums: {
      feedback_status: "new" | "in_progress" | "resolved"
      feedback_type: "bug" | "feature" | "question" | "general"
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
      feedback_status: ["new", "in_progress", "resolved"],
      feedback_type: ["bug", "feature", "question", "general"],
    },
  },
} as const
