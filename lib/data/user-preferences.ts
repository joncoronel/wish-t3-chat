import { createClient } from "@/lib/supabase/server";
import { UserPreferences } from "@/types";

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("preferences")
    .eq("user_id", userId)
    .single();

  if (error) {
    // For new users, it's normal to not have settings yet
    if (error.code === "PGRST116") {
      // Not found - return default preferences
      return { apiKeyStorageMode: "encrypted" };
    }
    console.error("Error fetching user preferences:", error);
    return { apiKeyStorageMode: "encrypted" };
  }

  return settings?.preferences || { apiKeyStorageMode: "encrypted" };
}
