"use client";

import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { localApiKeysAtom, type ApiKeys } from "@/store/api-keys";
import { createClient } from "@/lib/supabase/client";

export function useApiKeys() {
  const [localApiKeys, setLocalApiKeys] = useAtom(localApiKeysAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize and get user ID
  useEffect(() => {
    async function initialize() {
      try {
        // Get current user
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.id) {
          setUserId(user.id);
          console.log("📱 Using localStorage for API keys");
        }
      } catch (error) {
        console.error("Error initializing API keys:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  // Get the current API keys from localStorage
  const apiKeys = localApiKeys;

  // Store API key function
  const storeApiKey = async (
    provider: string,
    apiKey: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      // Store in localStorage via Jotai
      setLocalApiKeys((prev) => ({ ...prev, [provider]: apiKey }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Delete API key function
  const deleteApiKey = async (
    provider: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      // Delete from localStorage via Jotai
      setLocalApiKeys((prev) => {
        const updated = { ...prev };
        delete updated[provider as keyof ApiKeys];
        return updated;
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Update multiple API keys
  const updateApiKeys = async (
    newKeys: ApiKeys,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Process each key
      for (const [provider, key] of Object.entries(newKeys)) {
        if (key && key.trim()) {
          const result = await storeApiKey(provider, key.trim());
          if (!result.success) {
            return result;
          }
        } else {
          // If key is empty, delete it
          await deleteApiKey(provider);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Clear all API keys
  const clearAllApiKeys = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setLocalApiKeys({});
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  return {
    apiKeys,
    isLoading,
    storeApiKey,
    deleteApiKey,
    updateApiKeys,
    clearAllApiKeys,
    // Helper to check if a provider has an API key
    hasApiKey: (provider: string) =>
      !!(apiKeys as Record<string, string>)[provider],
    // Helper to get storage method for display
    storageMethod: "Local Storage",
    userId,
  };
}
