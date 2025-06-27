import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    // Verify the request if needed
    const payload = await req.json();

    if (payload.table !== "attachments") {
      return new Response(
        JSON.stringify({
          error: "Invalid table",
        }),
        {
          status: 400,
        },
      );
    }

    const { id: attachmentId, file_path: filePath } = payload.old_record;

    console.log(`Cleaning up attachment: ${attachmentId} at path: ${filePath}`);

    // Delete file from storage
    if (filePath) {
      const { error: storageError } = await supabaseClient.storage
        .from("chat-attachments")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        // Don't throw here - we want to continue even if storage cleanup fails
      } else {
        console.log(`Successfully deleted file from storage: ${filePath}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Storage files deleted successfully",
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
      },
    );
  }
});
