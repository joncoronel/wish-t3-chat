import { createClient } from "@/lib/supabase/server";

export async function getEncryptedApiKeys(
  userId: string,
): Promise<Record<string, string>> {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("api_keys")
    .eq("user_id", userId)
    .single();

  if (error) {
    // For new users, it's normal to not have settings yet
    if (error.code === "PGRST116") {
      // Not found
      return {};
    }
    console.error("Error fetching encrypted API keys:", error);
    return {};
  }

  return settings?.api_keys || {};
}
