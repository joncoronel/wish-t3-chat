import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { SharedConversationData } from "@/app/share/[token]/shared-conversation-view";

async function fetchSharedConversation(token: string): Promise<SharedConversationData> {
  const supabase = createClient();

  // Get shared conversation info
  const { data: sharedConv, error: shareError } = await supabase
    .from("shared_conversations")
    .select("conversation_id, expires_at, view_count, branch_name")
    .eq("share_token", token)
    .single();

  if (shareError || !sharedConv) {
    throw new Error("Shared conversation not found");
  }

  // Check if share has expired
  if (sharedConv.expires_at) {
    const expiryDate = new Date(sharedConv.expires_at);
    if (expiryDate < new Date()) {
      throw new Error("Share link has expired");
    }
  }

  // Get conversation details
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, title, model, created_at, updated_at")
    .eq("id", sharedConv.conversation_id)
    .eq("is_shared", true)
    .single();

  if (convError || !conversation) {
    throw new Error("Conversation not found or not shared");
  }

  // Get all branches for the conversation
  const { data: branches, error: branchError } = await supabase
    .from("conversation_branches")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  if (branchError) {
    console.error("Error fetching branches:", branchError);
  }

  // Get messages for the shared branch only
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select(
      `
      id,
      role,
      content,
      created_at,
      parent_id,
      branch_name,
      metadata,
      attachments (
        id,
        filename,
        file_type,
        file_size,
        file_path,
        metadata
      )
    `,
    )
    .eq("conversation_id", conversation.id)
    .eq("branch_name", sharedConv.branch_name)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
    throw new Error("Error fetching messages");
  }

  return {
    conversation,
    branches: branches
      ? branches.filter((b) => b.branch_name === sharedConv.branch_name)
      : [],
    messages: messages || [],
    view_count: sharedConv.view_count || 0,
    shared_branch: sharedConv.branch_name,
  };
}

export function useSharedConversation(token: string) {
  return useSWR(
    token ? `share-${token}` : null,
    token ? () => fetchSharedConversation(token) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      // Disable automatic revalidation but allow manual refresh
    }
  );
}