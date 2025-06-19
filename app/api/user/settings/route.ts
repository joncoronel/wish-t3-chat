import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateSettingsSchema = z.object({
  default_model: z.string().optional(),
  theme: z.enum(["light", "dark"]).optional(),
  preferences: z.record(z.unknown()).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateSettingsSchema.parse(body);

    const supabase = await createClient();

    // Handle settings (API keys are managed separately via /api/user/api-keys)
    if (
      validatedData.default_model ||
      validatedData.theme ||
      validatedData.preferences
    ) {
      // Check if user settings exist
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingSettings) {
        // Update existing settings
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (validatedData.default_model) {
          updateData.default_model = validatedData.default_model;
        }

        if (validatedData.theme) {
          updateData.theme = validatedData.theme;
        }

        if (validatedData.preferences) {
          updateData.preferences = validatedData.preferences;
        }

        const { error } = await supabase
          .from("user_settings")
          .update(updateData)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating user settings:", error);
          return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 },
          );
        }
      } else {
        // Create new settings record
        const { error } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            api_keys: {}, // Empty object initially - API keys handled separately
            default_model: validatedData.default_model || "gpt-4",
            theme: validatedData.theme || "dark",
            preferences: validatedData.preferences || {},
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating user settings:", error);
          return NextResponse.json(
            { error: "Failed to create settings" },
            { status: 500 },
          );
        }
      }
    }

    // Get the updated settings (includes encrypted API keys)
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      settings: userSettings,
    });
  } catch (error) {
    console.error("Settings API error:", error);

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

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user settings from database (includes encrypted API keys)
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Error fetching user settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 },
      );
    }

    // Return settings with encrypted API keys (decryption happens client-side)
    const completeSettings = settings
      ? settings
      : {
          user_id: user.id,
          default_model: "gpt-4",
          theme: "dark",
          api_keys: {}, // Empty object initially
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    return NextResponse.json({
      settings: completeSettings,
    });
  } catch (error) {
    console.error("Settings GET API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
