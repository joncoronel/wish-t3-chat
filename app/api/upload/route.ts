import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
};

const ALL_ALLOWED_TYPES = [...ALLOWED_TYPES.images, ...ALLOWED_TYPES.documents];

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Allowed types: images (JPEG, PNG, GIF, WebP) and documents (PDF, TXT, DOC, DOCX, XLS, XLSX, PPT, PPTX)`,
    };
  }

  return { valid: true };
}

function getFileCategory(mimeType: string): "image" | "document" {
  if (ALLOWED_TYPES.images.includes(mimeType)) {
    return "image";
  }
  return "document";
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to avoid bundling issues with Turbopack
    const pdf = (await import("pdf-parse")).default;

    // Use pdf-parse to extract text
    const data = await pdf(buffer);

    if (data.text && data.text.trim().length > 0) {
      // Clean up the extracted text
      const cleanedText = data.text
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, "\n\n") // Clean up multiple newlines
        .trim();

      return `PDF Content (${data.numpages} pages):\n\n${cleanedText}`;
    } else {
      return `PDF document: ${file.name} (${data.numpages} pages, ${(file.size / 1024).toFixed(1)} KB) - No text content extracted`;
    }
  } catch (error) {
    console.error("PDF text extraction failed:", error);
    return `PDF document: ${file.name} (${(file.size / 1024).toFixed(1)} KB) - Text extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadResults = [];
    const errors = [];

    for (const file of files) {
      const validation = validateFile(file);

      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // Create unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);
        const fileExtension = file.name.split(".").pop();
        const uniqueFilename = `${timestamp}-${randomId}.${fileExtension}`;
        const filePath = `attachments/${user.id}/${uniqueFilename}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          errors.push(`${file.name}: Upload failed`);
          continue;
        }

        // Get signed URL (private bucket - expires in 24 hours)
        const { data: urlData, error: urlError } = await supabase.storage
          .from("chat-attachments")
          .createSignedUrl(filePath, 86400); // 24 hours

        if (urlError) {
          console.error("Error creating signed URL:", urlError);
          errors.push(`${file.name}: Failed to create access URL`);

          // Clean up uploaded file
          await supabase.storage.from("chat-attachments").remove([filePath]);
          continue;
        }

        let extractedText = null;
        const metadata: Record<string, unknown> = {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        };

        // Extract text from PDF
        if (file.type === "application/pdf") {
          extractedText = await extractTextFromPDF(file);
          metadata.extractedText = extractedText;
        }

        // Save attachment record to database
        const { data: attachmentData, error: dbError } = await supabase
          .from("attachments")
          .insert({
            user_id: user.id,
            filename: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            metadata: metadata,
          })
          .select()
          .single();

        if (dbError) {
          console.error("Database error:", dbError);
          errors.push(`${file.name}: Database save failed`);

          // Clean up uploaded file
          await supabase.storage.from("chat-attachments").remove([filePath]);
          continue;
        }

        uploadResults.push({
          id: attachmentData.id,
          name: file.name,
          url: urlData.signedUrl,
          size: file.size,
          type: getFileCategory(file.type),
          mime_type: file.type,
          extractedText,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        errors.push(`${file.name}: Processing failed`);
      }
    }

    // Revalidate any cached data
    revalidatePath("/chat");

    return NextResponse.json({
      success: true,
      files: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    // Get attachment record
    const { data: attachment, error: fetchError } = await supabase
      .from("attachments")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("chat-attachments")
      .remove([attachment.file_path]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("attachments")
      .delete()
      .eq("id", fileId)
      .eq("user_id", user.id);

    if (dbError) {
      return NextResponse.json(
        { error: "Database deletion failed" },
        { status: 500 },
      );
    }

    revalidatePath("/chat");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
