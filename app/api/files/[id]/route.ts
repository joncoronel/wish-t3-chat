import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;

    // Get attachment record and verify user has access
    const { data: attachment, error: fetchError } = await supabase
      .from("attachments")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 },
      );
    }

    // Generate new signed URL (24 hours)
    const { data: urlData, error: urlError } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(attachment.file_path, 86400);

    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      return NextResponse.json(
        { error: "Failed to generate file access URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      url: urlData.signedUrl,
      filename: attachment.filename,
      size: attachment.file_size,
      type: attachment.file_type,
    });
  } catch (error) {
    console.error("File access API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
