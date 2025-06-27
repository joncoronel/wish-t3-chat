import { createClient } from "@/lib/supabase/server";
import type { Conversation, Message } from "@/types";
import { cache } from "react";

export const getConversations = cache(async (userId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  return data || [];
});

export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<Conversation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (error) {
    // Only log errors that are not "no rows returned" (PGRST116)
    // This is expected for new conversations that don't exist yet
    if (error.code !== "PGRST116") {
      console.error("Error fetching conversation:", error);
    }
    return null;
  }

  return data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("branch_name", "main")
    .order("created_at", { ascending: true });

  if (error) {
    // Only log errors that are not related to missing conversations
    // For new conversations, it's normal to have no messages initially
    console.error("Error fetching messages:", error);
    return [];
  }

  return data || [];
}
