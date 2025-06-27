import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

// GET /api/conversations/[id]/messages - Get messages for a conversation branch
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const branchName = searchParams.get("branch") || "main";

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Verify the branch exists
    const { data: branch, error: branchError } = await supabase
      .from("conversation_branches")
      .select("branch_name")
      .eq("conversation_id", conversationId)
      .eq("branch_name", branchName)
      .single();

    if (branchError || !branch) {
      return new Response("Branch not found", { status: 404 });
    }

    // Get messages for the specific branch
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("branch_name", branchName)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return new Response("Error fetching messages", { status: 500 });
    }

    return Response.json({ messages });
  } catch (error) {
    console.error("Messages GET error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}