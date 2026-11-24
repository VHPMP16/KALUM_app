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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          bucket: string
          conversation_id: string
          created_at: string
          id: string
          message_id: string
          mime_type: string
          object_path: string
          original_name: string
          scan_status: string
          sha256: string | null
          size_bytes: number
          uploader_id: string
        }
        Insert: {
          bucket: string
          conversation_id: string
          created_at?: string
          id?: string
          message_id: string
          mime_type: string
          object_path: string
          original_name: string
          scan_status?: string
          sha256?: string | null
          size_bytes: number
          uploader_id: string
        }
        Update: {
          bucket?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_id?: string
          mime_type?: string
          object_path?: string
          original_name?: string
          scan_status?: string
          sha256?: string | null
          size_bytes?: number
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          added_by: string | null
          conversation_id: string
          joined_at: string
          left_at: string | null
          member_role: string
          profile_id: string
        }
        Insert: {
          added_by?: string | null
          conversation_id: string
          joined_at?: string
          left_at?: string | null
          member_role?: string
          profile_id: string
        }
        Update: {
          added_by?: string | null
          conversation_id?: string
          joined_at?: string
          left_at?: string | null
          member_role?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          direct_key: string | null
          id: string
          title: string | null
          type: Database["public"]["Enums"]["conversation_type"]
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          direct_key?: string | null
          id?: string
          title?: string | null
          type: Database["public"]["Enums"]["conversation_type"]
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          direct_key?: string | null
          id?: string
          title?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      message_receipts: {
        Row: {
          delivered_at: string | null
          message_id: string
          profile_id: string
          read_at: string | null
        }
        Insert: {
          delivered_at?: string | null
          message_id: string
          profile_id: string
          read_at?: string | null
        }
        Update: {
          delivered_at?: string | null
          message_id?: string
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_receipts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          client_message_id: string
          conversation_id: string
          created_at: string
          id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          client_message_id: string
          conversation_id: string
          created_at?: string
          id?: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          client_message_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          profile_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          profile_id: string
          role_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          profile_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          corporate_email: string
          created_at: string
          department_id: string | null
          disabled_at: string | null
          employee_code: string | null
          full_name: string
          id: string
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          corporate_email: string
          created_at?: string
          department_id?: string | null
          disabled_at?: string | null
          employee_code?: string | null
          full_name: string
          id: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          corporate_email?: string
          created_at?: string
          department_id?: string | null
          disabled_at?: string | null
          employee_code?: string | null
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_conversation: {
        Args: {
          _member_ids?: string[]
          _title?: string
          _type: Database["public"]["Enums"]["conversation_type"]
        }
        Returns: string
      }
      search_chatapp: {
        Args: { _query: string; _limit?: number }
        Returns: {
          category: string
          id: string
          title: string
          subtitle: string | null
          snippet: string | null
          conversation_id: string | null
          created_at: string
        }[]
      }
      get_conversation_summaries: {
        Args: Record<PropertyKey, never>
        Returns: {
          conversation_id: string
          conversation_type: Database["public"]["Enums"]["conversation_type"]
          conversation_title: string | null
          created_at: string
          participant_name: string | null
          participant_avatar_path: string | null
          active_member_count: number
          last_message_body: string | null
          last_message_sender_name: string | null
          last_message_created_at: string | null
          last_attachment_mime_type: string | null
          last_attachment_scan_status: string | null
        }[]
      }
      admin_get_settings: {
        Args: Record<PropertyKey, never>
        Returns: { setting_key: string; setting_value: Json; description: string; updated_at: string }[]
      }
      admin_update_settings: {
        Args: { _settings: Json }
        Returns: undefined
      }
      admin_search_audit_logs: {
        Args: { _from?: string | null; _to?: string | null; _actor?: string | null; _action?: string | null; _page?: number; _page_size?: number }
        Returns: { id: string; actor_profile_id: string | null; actor_name: string; action: string; resource_type: string; resource_id: string | null; reason: string | null; metadata: Json; occurred_at: string; total_count: number }[]
      }
      admin_search_activity_logs: {
        Args: { _from?: string | null; _to?: string | null; _actor?: string | null; _event?: string | null; _outcome?: string | null; _page?: number; _page_size?: number }
        Returns: { id: string; source: string; actor_profile_id: string | null; actor_name: string; event_type: string; outcome: string; target_profile_id: string | null; target_name: string | null; reason: string | null; metadata: Json; occurred_at: string; total_count: number }[]
      }
      create_attachment_message: {
        Args: { _conversation_id: string; _client_message_id: string; _original_name: string; _mime_type: string; _size_bytes: number; _sha256: string; _object_path: string }
        Returns: { id: string; conversation_id: string; sender_id: string; client_message_id: string; body: string; reply_to_id: string | null; created_at: string; attachment_id: string; scan_status: string }[]
      }
      get_message_attachment_status: {
        Args: { _conversation_id: string }
        Returns: { message_id: string; attachment_id: string; original_name: string; mime_type: string; size_bytes: number; scan_status: string; bucket: string; object_path: string | null }[]
      }
      admin_list_attachments: {
        Args: { _status?: string | null; _page?: number; _page_size?: number }
        Returns: { id: string; conversation_id: string; message_id: string; uploader_id: string; uploader_name: string; original_name: string; mime_type: string; size_bytes: number; scan_status: string; bucket: string; object_path: string; created_at: string; total_count: number }[]
      }
      admin_delete_attachment: {
        Args: { _attachment_id: string; _reason: string }
        Returns: undefined
      }
      admin_set_profile_status: {
        Args: {
          _profile_id: string
          _status: Database["public"]["Enums"]["profile_status"]
          _reason: string
        }
        Returns: undefined
      }
      admin_set_profile_role: {
        Args: {
          _profile_id: string
          _role_code: string
          _grant: boolean
          _reason: string
        }
        Returns: undefined
      }
      admin_record_invitation: {
        Args: { _invited_profile_id: string; _email_domain: string }
        Returns: undefined
      }
    }
    Enums: {
      conversation_type: "direct" | "group"
      profile_status: "pending_invitation" | "active" | "disabled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      conversation_type: ["direct", "group"],
      profile_status: ["pending_invitation", "active", "disabled"],
    },
  },
} as const
