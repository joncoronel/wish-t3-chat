import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Validation schema
const createBranchFromMessageSchema = z.object({
  branchName: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  newMessage: z.string().optional(), // Optional new message to start the branch
});

// POST /api/messages/[id]/branch - Create a new branch from a specific message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: messageId } = await params;
    
    // Parse and validate request body
    const body = await req.json();
    const { branchName, displayName, description, newMessage } = 
      createBranchFromMessageSchema.parse(body);

    // Get the source message and verify ownership
    const { data: sourceMessage, error: msgError } = await supabase
      .from("messages")
      .select(`
        id,
        conversation_id,
        role,
        content,
        branch_name,
        parent_id,
        created_at,
        conversations!inner (
          user_id
        )
      `)
      .eq("id", messageId)
      .single();

    if (msgError || !sourceMessage) {
      return Response.json(
        { error: "Source message not found" },
        { status: 404 }
      );
    }

    // Check if user owns the conversation
    // @ts-expect-error - Supabase types are complex with joins
    if (sourceMessage.conversations.user_id !== user.id) {
      return new Response("Unauthorized", { status: 403 });
    }

    const conversationId = sourceMessage.conversation_id;

    // Check if branch name already exists
    const { data: existingBranch } = await supabase
      .from("conversation_branches")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("branch_name", branchName)
      .single();

    if (existingBranch) {
      return Response.json(
        { error: "Branch name already exists" },
        { status: 400 }
      );
    }

    // Get all messages in the source branch up to and including the source message
    const { data: precedingMessages, error: precedingError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("branch_name", sourceMessage.branch_name)
      .lte("created_at", sourceMessage.created_at)
      .order("created_at", { ascending: true });

    if (precedingError) {
      console.error("Error fetching preceding messages:", precedingError);
      return new Response("Error fetching conversation history", { status: 500 });
    }

    // Start a transaction-like operation
    try {
      // Create the new branch
      const { data: newBranch, error: createBranchError } = await supabase
        .from("conversation_branches")
        .insert({
          id: uuidv4(),
          conversation_id: conversationId,
          branch_name: branchName,
          display_name: displayName,
          description: description || null,
          created_from_message_id: messageId,
          is_active: false,
          message_count: 0, // Will be updated by trigger
        })
        .select()
        .single();

      if (createBranchError) {
        console.error("Error creating branch:", createBranchError);
        return new Response("Error creating branch", { status: 500 });
      }

      // Copy all preceding messages to the new branch
      const messagesToCopy = precedingMessages.map(msg => ({
        id: uuidv4(),
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata,
        parent_id: msg.parent_id,
        is_active: true,
        branch_name: branchName,
        attachments: msg.attachments,
        created_at: msg.created_at,
      }));

      const { error: copyError } = await supabase
        .from("messages")
        .insert(messagesToCopy);

      if (copyError) {
        console.error("Error copying messages:", copyError);
        // Clean up the branch if message copying fails
        await supabase
          .from("conversation_branches")
          .delete()
          .eq("id", newBranch.id);
        return new Response("Error copying messages to new branch", { status: 500 });
      }

      // If a new message is provided, add it to the branch
      if (newMessage && newMessage.trim()) {
        const { error: newMsgError } = await supabase
          .from("messages")
          .insert({
            id: uuidv4(),
            conversation_id: conversationId,
            role: "user",
            content: newMessage.trim(),
            branch_name: branchName,
            parent_id: messageId,
            is_active: true,
          });

        if (newMsgError) {
          console.error("Error adding new message:", newMsgError);
          // Don't fail the entire operation for this
        }
      }

      return Response.json({ 
        branch: newBranch,
        copiedMessages: messagesToCopy.length,
        hasNewMessage: !!newMessage?.trim()
      }, { status: 201 });
    } catch (error) {
      console.error("Transaction error:", error);
      return new Response("Error creating branch", { status: 500 });
    }
  } catch (error) {
    console.error("Branch from message error:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 }
      );
    }

    return new Response("Internal server error", { status: 500 });
  }
}