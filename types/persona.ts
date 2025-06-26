import { Database } from "./database";

export type Persona = Database["public"]["Tables"]["personas"]["Row"];
export type PersonaInsert = Database["public"]["Tables"]["personas"]["Insert"];
export type PersonaUpdate = Database["public"]["Tables"]["personas"]["Update"];

export type PersonaMemory = Database["public"]["Tables"]["persona_memories"]["Row"];
export type PersonaMemoryInsert = Database["public"]["Tables"]["persona_memories"]["Insert"];
export type PersonaMemoryUpdate = Database["public"]["Tables"]["persona_memories"]["Update"];

export interface PersonaMetadata {
  voiceId?: string;
  voiceSettings?: {
    speed?: number;
    pitch?: number;
  };
  personalityTraits?: string[];
  knowledgeDomains?: string[];
  conversationStyle?: "formal" | "casual" | "technical" | "creative";
}

export interface PersonaWithMemories extends Persona {
  memories?: PersonaMemory[];
  recentConversations?: number;
}