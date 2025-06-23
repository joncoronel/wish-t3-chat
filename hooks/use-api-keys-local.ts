"use client";

import { useCallback } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { ApiKeys } from "@/store/api-keys";

// Local storage atom for API keys (unencrypted in localStorage)
// Using a function to avoid SSR hydration issues
const localApiKeysAtom = atomWithStorage<ApiKeys>("api-keys", {}, undefined, {
  getOnInit: true, // This helps with SSR hydration
});

export function useApiKeysLocal() {
  const [apiKeys, setApiKeys] = useAtom(localApiKeysAtom);

  // Store API key function
  const storeApiKey = useCallback(
    async (
      provider: string,
      apiKey: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setApiKeys((prev) => ({
          ...prev,
          [provider]: apiKey,
        }));

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [setApiKeys],
  );

  // Delete API key function
  const deleteApiKey = useCallback(
    async (provider: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setApiKeys((prev) => {
          const newKeys = { ...prev };
          delete (newKeys as Record<string, string>)[provider];
          return newKeys;
        });

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [setApiKeys],
  );

  // Update multiple API keys
  const updateApiKeys = useCallback(
    async (newKeys: ApiKeys): Promise<{ success: boolean; error?: string }> => {
      try {
        setApiKeys(newKeys);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [setApiKeys],
  );

  // Clear all API keys
  const clearAllApiKeys = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setApiKeys({});
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [setApiKeys]);

  // Helper to check if a provider has an API key
  const hasApiKey = useCallback(
    (provider: string) => {
      return !!(apiKeys as Record<string, string>)[provider];
    },
    [apiKeys],
  );

  return {
    apiKeys,
    isLoading: false, // Local storage is synchronous
    storeApiKey,
    deleteApiKey,
    updateApiKeys,
    clearAllApiKeys,
    hasApiKey,
    isEncryptionAvailable: true, // Always available for local storage
    error: null,
    mutate: async () => {}, // No-op for local storage
  };
}
