import type { Database } from "./database";

// Helper types for Supabase
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Application types
export type User = Tables<"users">;
export type UserSettings = Tables<"user_settings">;
export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;
export type Folder = Tables<"folders">;
export type SharedConversation = Tables<"shared_conversations">;
export type Attachment = Tables<"attachments">;
export type ApiUsage = Tables<"api_usage">;

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

// AI Provider types
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  input_price_per_token: number;
  output_price_per_token: number;
  supports_vision: boolean;
  supports_function_calling: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  api_key_required: boolean;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    tool_calls?: unknown[];
  };
  attachments?: ChatAttachment[];
  parent_id?: string;
  children?: string[];
}

export interface ChatAttachment {
  id: string;
  type: "image" | "document" | "text";
  name: string;
  url: string;
  size: number;
  mime_type: string;
  extractedText?: string;
}

export interface ChatSettings {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
}

// UI State types
export interface AppState {
  user: AuthUser | null;
  activeConversation: Conversation | null;
  conversations: Conversation[];
  messages: Message[];
  isLoading: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark";
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  full_name: string;
}

export interface ConversationForm {
  title: string;
  model: string;
  system_prompt?: string;
  folder_id?: string;
}

export interface MessageForm {
  content: string;
  attachments?: File[];
}

// Search types
export interface SearchResult {
  id: string;
  type: "conversation" | "message";
  title: string;
  snippet: string;
  conversation_id: string;
  relevance_score: number;
}

// Sharing types
export interface ShareSettings {
  is_public: boolean;
  expires_at?: Date;
  password?: string;
}

export { type Database } from "./database";
