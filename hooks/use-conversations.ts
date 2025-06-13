"use client";

import useSWR, { mutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/types";

// Client-side fetchers
async function fetchConversations(userId: string): Promise<Conversation[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchConversation(
  conversationId: string,
  userId: string,
): Promise<Conversation | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

async function fetchMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Mutation functions
export async function createConversation(
  userId: string,
  title: string,
  model: string = "gpt-4",
): Promise<Conversation | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title,
      model,
      system_prompt: null,
      is_shared: false,
      share_token: null,
      folder_id: null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }

  // Update the conversations cache
  mutate(`conversations-${userId}`);

  return data;
}

export async function createMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
): Promise<Message | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata: null,
      parent_id: null,
      is_active: true,
      attachments: null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating message:", error);
    throw error;
  }

  // Update the messages cache
  mutate(`messages-${conversationId}`);

  // Also update the conversation timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}

export async function deleteConversation(
  conversationId: string,
  userId: string,
  currentConversations?: Conversation[],
): Promise<void> {
  const supabase = createClient();

  // Delete function for the actual database operation
  const deleteFunction = async () => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
    return null;
  };

  try {
    // Use mutate with optimistic updates using provided cached data
    await mutate(`conversations-${userId}`, deleteFunction(), {
      populateCache: false,
      revalidate: true,
      optimisticData:
        currentConversations?.filter((conv) => conv.id !== conversationId) ||
        [],
      rollbackOnError: true,
    });

    // Clear the conversation and messages cache
    mutate(`conversation-${conversationId}-${userId}`, null, {
      revalidate: false,
    });
    mutate(`messages-${conversationId}`, [], { revalidate: false });
  } catch (error) {
    console.error("Delete failed:", error);
    throw error;
  }
}

// SWR Hooks
export function useConversations(userId: string) {
  return useSWR(
    userId ? `conversations-${userId}` : null,
    () => fetchConversations(userId),
    {
      revalidateOnMount: false,
      revalidateOnFocus: false,
    },
  );
}

export function useConversation(conversationId: string, userId: string) {
  return useSWR(
    conversationId && userId
      ? `conversation-${conversationId}-${userId}`
      : null,
    () => fetchConversation(conversationId, userId),
    {
      revalidateOnMount: false,
      revalidateOnFocus: false,
    },
  );
}

export function useMessages(conversationId: string) {
  return useSWR(
    conversationId ? `messages-${conversationId}` : null,
    () => fetchMessages(conversationId),
    {
      revalidateOnMount: false,
      revalidateOnFocus: false,
    },
  );
}

// Helper function to create a new chat
export async function createNewChat(
  userId: string,
  title: string,
): Promise<Conversation | null> {
  try {
    // Create conversation only - let useChat handle the first message
    const conversation = await createConversation(userId, title);

    return conversation;
  } catch (error) {
    console.error("Error creating new chat:", error);
    return null;
  }
}
