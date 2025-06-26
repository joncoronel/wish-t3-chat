import { createClient } from "@/lib/supabase/client";
import { Persona, PersonaInsert, PersonaUpdate, PersonaWithMemories } from "@/types/persona";

export async function getPersonas(): Promise<PersonaWithMemories[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("personas")
    .select(`
      *,
      persona_memories (count)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching personas:", error);
    throw error;
  }

  return data.map(persona => ({
    ...persona,
    recentConversations: persona.persona_memories?.[0]?.count || 0
  }));
}

export async function getPersona(id: string): Promise<Persona | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("personas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching persona:", error);
    throw error;
  }

  return data;
}

export async function createPersona(persona: Omit<PersonaInsert, "user_id">): Promise<Persona> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("personas")
    .insert({ ...persona, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("Error creating persona:", error);
    throw error;
  }

  return data;
}

export async function updatePersona(id: string, updates: PersonaUpdate): Promise<Persona> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("personas")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating persona:", error);
    throw error;
  }

  return data;
}

export async function deletePersona(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("personas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting persona:", error);
    throw error;
  }
}

export async function getDefaultPersona(): Promise<Persona | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("personas")
    .select("*")
    .eq("is_default", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching default persona:", error);
    throw error;
  }

  return data;
}