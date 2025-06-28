import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { nanoid } from "nanoid";

// POST /api/conversations/[id]/share - Create or update share settings
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

    const { id: conversationId } = await params;
    const body = await req.json();
    const { is_public, expires_at, branch_name } = body;

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, is_shared, share_token")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Generate a unique share token for this branch
    let shareToken = null;
    if (is_public) {
      // Check if this branch already has a share token
      const { data: existingShare } = await supabase
        .from("shared_conversations")
        .select("share_token")
        .eq("conversation_id", conversationId)
        .eq("branch_name", branch_name || "main")
        .single();
      
      shareToken = existingShare?.share_token || nanoid(12);
    }

    // Handle shared_conversations table
    if (is_public) {
      // Check if share entry already exists for this conversation and branch
      const { data: existingShare } = await supabase
        .from("shared_conversations")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("branch_name", branch_name || "main")
        .single();

      let shareError;
      if (existingShare) {
        // Update existing share entry
        const { error } = await supabase
          .from("shared_conversations")
          .update({
            share_token: shareToken,
            expires_at: expires_at || null,
          })
          .eq("conversation_id", conversationId)
          .eq("branch_name", branch_name || "main");
        shareError = error;
      } else {
        // Insert new share entry
        const { error } = await supabase
          .from("shared_conversations")
          .insert({
            conversation_id: conversationId,
            share_token: shareToken,
            branch_name: branch_name || "main",
            expires_at: expires_at || null,
            view_count: 0,
          });
        shareError = error;
      }

      if (shareError) {
        console.error("Error creating share entry:", shareError);
        return new Response("Error creating share entry", { status: 500 });
      }
    } else {
      // Delete share entry if disabling sharing for specific branch
      const { error: deleteError } = await supabase
        .from("shared_conversations")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("branch_name", branch_name || "main");

      if (deleteError) {
        console.error("Error deleting share entry:", deleteError);
        return new Response("Error deleting share entry", { status: 500 });
      }
    }

    // Update conversation sharing status based on whether any branches are shared
    const { data: anySharedBranches } = await supabase
      .from("shared_conversations")
      .select("id")
      .eq("conversation_id", conversationId)
      .limit(1);

    const hasSharedBranches = anySharedBranches && anySharedBranches.length > 0;

    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        is_shared: hasSharedBranches,
        share_token: hasSharedBranches ? shareToken : null,
      })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating conversation:", updateError);
      return new Response("Error updating share settings", { status: 500 });
    }

    return Response.json({
      is_shared: is_public,
      share_token: is_public ? shareToken : null,
      share_url: is_public ? `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || 'http://localhost:3000'}/share/${shareToken}` : null,
    });
  } catch (error) {
    console.error("Share POST error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// GET /api/conversations/[id]/share - Get current share settings
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

    // Get conversation with share info
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, is_shared, share_token")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Get all shared branches for this conversation
    const { data: shareData, error: shareError } = await supabase
      .from("shared_conversations")
      .select("share_token, expires_at, view_count, branch_name")
      .eq("conversation_id", conversationId);

    if (shareError) {
      console.error("Error fetching share data:", shareError);
    }

    const sharedBranches = shareData || [];
    const hasSharedBranches = sharedBranches.length > 0;

    if (hasSharedBranches) {
      return Response.json({
        is_shared: true,
        shared_branches: sharedBranches.map(branch => ({
          branch_name: branch.branch_name,
          share_token: branch.share_token,
          share_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || 'http://localhost:3000'}/share/${branch.share_token}`,
          expires_at: branch.expires_at,
          view_count: branch.view_count,
        })),
        has_password: false,
      });
    }

    return Response.json({
      is_shared: false,
      share_token: null,
      share_url: null,
    });
  } catch (error) {
    console.error("Share GET error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// DELETE /api/conversations/[id]/share - Disable sharing
export async function DELETE(
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
    const url = new URL(req.url);
    const branchName = url.searchParams.get("branch_name");

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

    if (branchName) {
      // Delete specific branch share
      const { error: deleteError } = await supabase
        .from("shared_conversations")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("branch_name", branchName);

      if (deleteError) {
        console.error("Error deleting branch share:", deleteError);
        return new Response("Error deleting branch share", { status: 500 });
      }
    } else {
      // Delete all shares for this conversation
      const { error: deleteError } = await supabase
        .from("shared_conversations")
        .delete()
        .eq("conversation_id", conversationId);

      if (deleteError) {
        console.error("Error deleting share entries:", deleteError);
        return new Response("Error deleting share entries", { status: 500 });
      }
    }

    // Update conversation sharing status based on remaining shares
    const { data: remainingShares } = await supabase
      .from("shared_conversations")
      .select("id")
      .eq("conversation_id", conversationId)
      .limit(1);

    const hasRemainingShares = remainingShares && remainingShares.length > 0;

    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        is_shared: hasRemainingShares,
        share_token: hasRemainingShares ? null : null, // We don't use this field anymore
      })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating conversation:", updateError);
      return new Response("Error updating conversation", { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Share DELETE error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}