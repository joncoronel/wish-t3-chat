"use client";

import { useCallback } from "react";
import { useApiKeys } from "./use-api-keys";
import { useApiKeysLocal } from "./use-api-keys-local";
import { useUserPreferences } from "./use-user-preferences";
import { toast } from "sonner";

interface UseApiKeysUnifiedProps {
  userId: string;
}

export function useApiKeysUnified({ userId }: UseApiKeysUnifiedProps) {
  const { preferences, apiKeyStorageMode, updateApiKeyStorageMode } =
    useUserPreferences({ userId });

  // Both hooks - we'll use one based on preference
  const encryptedHook = useApiKeys({ userId });
  const localHook = useApiKeysLocal();

  // Determine which hook to use based on user preference
  const isUsingEncrypted = apiKeyStorageMode === "encrypted";
  const activeHook = isUsingEncrypted ? encryptedHook : localHook;

  // Migration function to move API keys between storage methods
  const migrateApiKeys = useCallback(
    async (
      fromLocal: boolean,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const sourceKeys = fromLocal
          ? localHook.apiKeys
          : encryptedHook.apiKeys;
        const targetHook = fromLocal ? encryptedHook : localHook;

        // Only migrate if there are keys to migrate
        if (Object.keys(sourceKeys).length === 0) {
          return { success: true };
        }

        // Store keys in the target storage
        const result = await targetHook.updateApiKeys(sourceKeys);
        if (!result.success) {
          return result;
        }

        // Clear keys from the source storage
        const clearResult = fromLocal
          ? await localHook.clearAllApiKeys()
          : await encryptedHook.clearAllApiKeys();

        if (!clearResult.success) {
          console.warn("Failed to clear source keys after migration");
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Migration failed",
        };
      }
    },
    [encryptedHook, localHook],
  );

  // Switch storage mode with migration
  const switchStorageMode = useCallback(
    async (newMode: "encrypted" | "local") => {
      try {
        const currentMode = apiKeyStorageMode;

        if (currentMode === newMode) {
          return { success: true };
        }

        // Migrate API keys from current storage to new storage
        const fromLocal = currentMode === "local";
        const migrationResult = await migrateApiKeys(fromLocal);

        if (!migrationResult.success) {
          toast.error(`Failed to migrate API keys: ${migrationResult.error}`);
          return migrationResult;
        }

        // Update the storage mode preference
        const prefResult = await updateApiKeyStorageMode(newMode);

        if (!prefResult.success) {
          toast.error(
            `Failed to update storage preference: ${prefResult.error}`,
          );
          return prefResult;
        }

        toast.success(
          `API keys successfully migrated to ${
            newMode === "encrypted" ? "encrypted database" : "local storage"
          }`,
        );

        return { success: true };
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Storage mode switch failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    },
    [apiKeyStorageMode, migrateApiKeys, updateApiKeyStorageMode],
  );

  return {
    // Pass through the active hook's interface
    ...activeHook,

    // Additional properties for storage management
    apiKeyStorageMode,
    switchStorageMode,
    isLoadingPreferences: !preferences,

    // Enhanced metadata
    storageInfo: {
      currentMode: apiKeyStorageMode,
      isEncrypted: isUsingEncrypted,
      hasLocalKeys: Object.keys(localHook.apiKeys).length > 0,
      hasEncryptedKeys: Object.keys(encryptedHook.apiKeys).length > 0,
    },
  };
}
