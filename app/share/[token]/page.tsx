import { notFound } from "next/navigation";
import { SWRConfig } from "swr";
import { createClient } from "@/lib/supabase/server";
import { SharedConversationView } from "./shared-conversation-view";

async function getSharedConversation(token: string) {
  const supabase = await createClient();

  // Get shared conversation info
  const { data: sharedConv, error: shareError } = await supabase
    .from("shared_conversations")
    .select("conversation_id, expires_at, view_count, branch_name")
    .eq("share_token", token)
    .single();

  if (shareError || !sharedConv) {
    return null;
  }

  // Check if share has expired
  if (sharedConv.expires_at) {
    const expiryDate = new Date(sharedConv.expires_at);
    if (expiryDate < new Date()) {
      return { expired: true };
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
    return null;
  }

  // Get all branches for the conversation
  const { data: branches, error: branchError } = await supabase
    .from("conversation_branches")
    .select("branch_name, display_name, description, created_at")
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
    return null;
  }

  // Increment view count (fire and forget)
  void supabase
    .from("shared_conversations")
    .update({ view_count: (sharedConv.view_count || 0) + 1 })
    .eq("share_token", token);

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

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getSharedConversation(token);

  if (!data) {
    notFound();
  }

  if ("expired" in data) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-semibold">Share Link Expired</h1>
          <p className="text-muted-foreground">
            This share link has expired and is no longer accessible.
          </p>
        </div>
      </div>
    );
  }

  // Provide fallback data to SWR
  const fallbackData = {
    [`share-${token}`]: data,
  };

  return (
    <SWRConfig value={{ fallback: fallbackData }}>
      <SharedConversationView token={token} />
    </SWRConfig>
  );
}
