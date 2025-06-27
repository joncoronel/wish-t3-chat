import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { Database } from "@/types/database";

// Validation schemas
const createBranchSchema = z.object({
  branchName: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  createdFromMessageId: z.string().optional(),
  messageIndex: z.number().optional(),
});

const updateBranchSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/conversations/[id]/branches - Get all branches for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: conversationId } = await params;

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

    // Get all branches for the conversation
    const { data: branches, error: branchError } = await supabase
      .from("conversation_branches")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (branchError) {
      console.error("Error fetching branches:", branchError);
      return new Response("Error fetching branches", { status: 500 });
    }

    return Response.json({ branches });
  } catch (error) {
    console.error("Branches GET error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// POST /api/conversations/[id]/branches - Create a new branch
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: conversationId } = await params;

    // Parse and validate request body
    const body = await req.json();
    const {
      branchName,
      displayName,
      description,
      createdFromMessageId,
      messageIndex,
    } = createBranchSchema.parse(body);

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
        { status: 400 },
      );
    }

    // If creating from a message, verify the message exists and belongs to this conversation
    if (createdFromMessageId) {
      const { data: message, error: msgError } = await supabase
        .from("messages")
        .select("id, conversation_id")
        .eq("id", createdFromMessageId)
        .eq("conversation_id", conversationId)
        .single();

      if (msgError || !message) {
        return Response.json(
          { error: "Source message not found" },
          { status: 400 },
        );
      }
    }

    // If no specific source message is provided, copy messages from the current active branch
    let messagesToCopy: Database["public"]["Tables"]["messages"]["Row"][] = [];
    if (!createdFromMessageId) {
      // Get the current active branch for this conversation
      const { data: activeBranch } = await supabase
        .from("conversation_branches")
        .select("branch_name")
        .eq("conversation_id", conversationId)
        .eq("is_active", true)
        .single();

      const sourceBranchName = activeBranch?.branch_name || "main";

      // Get messages from the source branch
      const { data: existingMessages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("branch_name", sourceBranchName)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error(
          "Error fetching messages for branch copy:",
          messagesError,
        );
        return new Response("Error fetching conversation history", {
          status: 500,
        });
      }

      messagesToCopy = existingMessages || [];

      // If messageIndex is provided, only copy messages up to that index
      if (typeof messageIndex === "number" && messageIndex >= 0) {
        messagesToCopy = messagesToCopy.slice(0, messageIndex + 1);
      }
    }

    // Create the new branch
    const { data: newBranch, error: createError } = await supabase
      .from("conversation_branches")
      .insert({
        id: uuidv4(),
        conversation_id: conversationId,
        branch_name: branchName,
        display_name: displayName,
        description: description || null,
        created_from_message_id: createdFromMessageId || null,
        is_active: false, // New branches start inactive
        message_count: 0, // Will be updated by trigger
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating branch:", createError);
      return new Response("Error creating branch", { status: 500 });
    }

    // Copy messages to the new branch if we have any
    if (messagesToCopy.length > 0) {
      const messageCopies = messagesToCopy.map((msg) => ({
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
        .insert(messageCopies);

      if (copyError) {
        console.error("Error copying messages to new branch:", copyError);
        // Clean up the branch if message copying fails
        await supabase
          .from("conversation_branches")
          .delete()
          .eq("id", newBranch.id);
        return new Response("Error copying messages to new branch", {
          status: 500,
        });
      }
    }

    return Response.json(
      {
        branch: newBranch,
        copiedMessages: messagesToCopy.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Branch creation error:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 },
      );
    }

    return new Response("Internal server error", { status: 500 });
  }
}

// PUT /api/conversations/[id]/branches - Update branch (typically to set active branch)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: conversationId } = await params;

    // Parse and validate request body
    const body = await req.json();

    const { branchName, ...updates } = z
      .object({
        branchName: z.string(),
        ...updateBranchSchema.shape,
      })
      .parse(body);

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

    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, string | boolean> = {};
    if (updates.displayName !== undefined) {
      dbUpdates.display_name = updates.displayName;
    }
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description;
    }
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
    }

    // Update the branch
    const { data: updatedBranch, error: updateError } = await supabase
      .from("conversation_branches")
      .update(dbUpdates)
      .eq("conversation_id", conversationId)
      .eq("branch_name", branchName)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating branch:", updateError);
      return Response.json(
        { error: "Error updating branch", details: updateError },
        { status: 500 },
      );
    }

    if (!updatedBranch) {
      return Response.json({ error: "Branch not found" }, { status: 404 });
    }

    return Response.json({ branch: updatedBranch });
  } catch (error) {
    console.error("Branch update error:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 },
      );
    }

    return new Response("Internal server error", { status: 500 });
  }
}

// DELETE /api/conversations/[id]/branches - Delete a branch
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const branchName = searchParams.get("branchName");

    if (!branchName) {
      return Response.json(
        { error: "Branch name is required" },
        { status: 400 },
      );
    }

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

    // Don't allow deletion of the main branch
    if (branchName === "main") {
      return Response.json(
        { error: "Cannot delete the main branch" },
        { status: 400 },
      );
    }

    // Check if branch exists
    const { data: branch } = await supabase
      .from("conversation_branches")
      .select("is_active")
      .eq("conversation_id", conversationId)
      .eq("branch_name", branchName)
      .single();

    if (!branch) {
      return new Response("Branch not found", { status: 404 });
    }

    // If deleting the active branch, set main as active
    if (branch.is_active) {
      await supabase
        .from("conversation_branches")
        .update({ is_active: true })
        .eq("conversation_id", conversationId)
        .eq("branch_name", "main");
    }

    // Delete all messages in this branch
    const { error: messagesError } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("branch_name", branchName);

    if (messagesError) {
      console.error("Error deleting branch messages:", messagesError);
      return new Response("Error deleting branch messages", { status: 500 });
    }

    // Delete the branch
    const { error: deleteError } = await supabase
      .from("conversation_branches")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("branch_name", branchName);

    if (deleteError) {
      console.error("Error deleting branch:", deleteError);
      return new Response("Error deleting branch", { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Branch deletion error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
