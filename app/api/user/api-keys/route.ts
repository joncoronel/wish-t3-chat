import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const storeApiKeySchema = z.object({
  provider: z.string(),
  encryptedKey: z.string(),
});

const deleteApiKeySchema = z.object({
  provider: z.string(),
});

// GET - Retrieve encrypted API keys for user
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user settings with encrypted API keys
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("api_keys")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Error fetching API keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 },
      );
    }

    const encryptedApiKeys = settings?.api_keys || {};

    return NextResponse.json({
      success: true,
      encryptedApiKeys,
    });
  } catch (error) {
    console.error("API keys GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Store encrypted API key
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { provider, encryptedKey } = storeApiKeySchema.parse(body);

    const supabase = await createClient();

    // Get existing settings or create new ones
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("api_keys")
      .eq("user_id", user.id)
      .single();

    const currentApiKeys = existingSettings?.api_keys || {};
    const updatedApiKeys = {
      ...currentApiKeys,
      [provider]: encryptedKey,
    };

    // Upsert the settings
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        api_keys: updatedApiKeys,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      console.error("Error storing API key:", error);
      return NextResponse.json(
        { error: "Failed to store API key" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key stored successfully",
    });
  } catch (error) {
    console.error("API keys POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Remove API key
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { provider } = deleteApiKeySchema.parse(body);

    const supabase = await createClient();

    // Get existing settings
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("api_keys")
      .eq("user_id", user.id)
      .single();

    if (!existingSettings?.api_keys) {
      return NextResponse.json({
        success: true,
        message: "No API keys to delete",
      });
    }

    const updatedApiKeys = { ...existingSettings.api_keys };
    delete updatedApiKeys[provider];

    // Update settings
    const { error } = await supabase
      .from("user_settings")
      .update({
        api_keys: updatedApiKeys,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting API key:", error);
      return NextResponse.json(
        { error: "Failed to delete API key" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("API keys DELETE error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
