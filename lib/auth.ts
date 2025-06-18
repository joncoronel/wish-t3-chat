import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AuthUser, UserSettings } from "@/types";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return null;
  }

  return data.user;
});

export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session) {
    return null;
  }

  return data.session;
});

export const getAuthUser = cache(async () => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: userProfile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !userProfile) {
    return null;
  }

  return {
    id: userProfile.id,
    email: userProfile.email,
    full_name: userProfile.full_name,
    avatar_url: userProfile.avatar_url,
  } as AuthUser;
});

export const getUserSettings = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data: userSettings, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !userSettings) {
    return null;
  }

  // API keys are now managed client-side via localStorage
  // Return settings without API keys - they'll be loaded client-side
  const completeSettings = {
    ...userSettings,
    api_keys: {}, // Empty object - API keys handled client-side
  } as UserSettings;

  return completeSettings;
});

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getUser();
  return user !== null;
};

// Helper function to redirect if not authenticated
export const requireAuth = async () => {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
};
