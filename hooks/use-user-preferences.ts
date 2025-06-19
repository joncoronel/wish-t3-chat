"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { UserPreferences, ApiKeyStorageMode } from "@/types";

// SWR fetcher for user preferences
const fetchUserPreferences = async (): Promise<UserPreferences> => {
  const response = await fetch("/api/user/settings", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user preferences");
  }

  const data = await response.json();
  return data.settings?.preferences || { apiKeyStorageMode: "encrypted" };
};

interface UseUserPreferencesProps {
  userId: string;
}

export function useUserPreferences({ userId }: UseUserPreferencesProps) {
  const {
    data: preferences = { apiKeyStorageMode: "encrypted" as ApiKeyStorageMode },
    error,
    mutate,
  } = useSWR(
    userId ? `user-preferences-${userId}` : null,
    fetchUserPreferences,
    {
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  // Update API key storage mode
  const updateApiKeyStorageMode = useCallback(
    async (
      mode: ApiKeyStorageMode,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch("/api/user/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences: {
              ...preferences,
              apiKeyStorageMode: mode,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update preferences");
        }

        // Update SWR cache
        await mutate();

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [preferences, mutate],
  );

  return {
    preferences,
    apiKeyStorageMode: preferences.apiKeyStorageMode || "encrypted",
    updateApiKeyStorageMode,
    isLoading: !preferences && !error,
    error,
    mutate,
  };
}
