export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          default_model: string;
          theme: string;
          api_keys: Record<string, string> | null;
          preferences: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          default_model?: string;
          theme?: string;
          api_keys?: Record<string, string> | null;
          preferences?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          default_model?: string;
          theme?: string;
          api_keys?: Record<string, string> | null;
          preferences?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          model: string;
          system_prompt: string | null;
          is_shared: boolean;
          share_token: string | null;
          folder_id: string | null;
          persona_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          model: string;
          system_prompt?: string | null;
          is_shared?: boolean;
          share_token?: string | null;
          folder_id?: string | null;
          persona_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          model?: string;
          system_prompt?: string | null;
          is_shared?: boolean;
          share_token?: string | null;
          folder_id?: string | null;
          persona_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "system" | "user" | "assistant";
          content: string;
          metadata: Record<string, unknown> | null;
          parent_id: string | null;
          is_active: boolean;
          branch_name: string;
          attachments: Array<Record<string, unknown>> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "system" | "user" | "assistant";
          content: string;
          metadata?: Record<string, unknown> | null;
          parent_id?: string | null;
          is_active?: boolean;
          branch_name?: string;
          attachments?: Array<Record<string, unknown>> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: "system" | "user" | "assistant";
          content?: string;
          metadata?: Record<string, unknown> | null;
          parent_id?: string | null;
          is_active?: boolean;
          branch_name?: string;
          attachments?: Array<Record<string, unknown>> | null;
          created_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_id?: string | null;
          created_at?: string;
        };
      };
      shared_conversations: {
        Row: {
          id: string;
          conversation_id: string;
          share_token: string;
          expires_at: string | null;
          view_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          share_token: string;
          expires_at?: string | null;
          view_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          share_token?: string;
          expires_at?: string | null;
          view_count?: number;
          created_at?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          file_path: string;
          file_type: string;
          file_size: number;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          file_path: string;
          file_type: string;
          file_size: number;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      api_usage: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          model: string;
          tokens_used: number;
          cost_usd: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          model: string;
          tokens_used: number;
          cost_usd?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          model?: string;
          tokens_used?: number;
          cost_usd?: number | null;
          created_at?: string;
        };
      };
      personas: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          system_prompt: string;
          avatar_url: string | null;
          temperature: number;
          max_tokens: number;
          is_default: boolean;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          system_prompt: string;
          avatar_url?: string | null;
          temperature?: number;
          max_tokens?: number;
          is_default?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          system_prompt?: string;
          avatar_url?: string | null;
          temperature?: number;
          max_tokens?: number;
          is_default?: boolean;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      persona_memories: {
        Row: {
          id: string;
          persona_id: string;
          conversation_id: string;
          summary: string;
          key_points: Array<string>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          persona_id: string;
          conversation_id: string;
          summary: string;
          key_points?: Array<string>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          persona_id?: string;
          conversation_id?: string;
          summary?: string;
          key_points?: Array<string>;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_branches: {
        Row: {
          id: string;
          conversation_id: string;
          branch_name: string;
          display_name: string;
          description: string | null;
          created_from_message_id: string | null;
          is_active: boolean;
          message_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          branch_name: string;
          display_name: string;
          description?: string | null;
          created_from_message_id?: string | null;
          is_active?: boolean;
          message_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          branch_name?: string;
          display_name?: string;
          description?: string | null;
          created_from_message_id?: string | null;
          is_active?: boolean;
          message_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// API Key Storage Preferences
export type ApiKeyStorageMode = "encrypted" | "local";

export interface UserPreferences {
  apiKeyStorageMode?: ApiKeyStorageMode;
  // ... other preferences can be added here
}
