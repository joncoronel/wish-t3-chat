"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import useSWR from "swr";
import {
  deriveEncryptionKey,
  encryptApiKey,
  decryptApiKey,
  isWebCryptoAvailable,
} from "@/lib/utils/encryption";
import {
  ApiKeys,
  decryptedApiKeysAtom,
  encryptionKeyAtom,
  isDecryptingAtom,
  hasApiKeyAtom,
} from "@/store/api-keys";

// SWR fetcher for encrypted API keys
const fetchEncryptedApiKeys = async () => {
  const response = await fetch("/api/user/api-keys", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch API keys");
  }

  const data = await response.json();
  return data.encryptedApiKeys || {};
};

interface UseApiKeysProps {
  userId: string;
}

export function useApiKeys({ userId }: UseApiKeysProps) {
  const [decryptedApiKeys, setDecryptedApiKeys] = useAtom(decryptedApiKeysAtom);
  const [encryptionKey, setEncryptionKey] = useAtom(encryptionKeyAtom);
  const [, setIsDecrypting] = useAtom(isDecryptingAtom);
  const [hasApiKey] = useAtom(hasApiKeyAtom);

  // Use SWR to fetch encrypted API keys (with fallback from server-side pre-loading)
  const {
    data: encryptedApiKeys = {},
    error: fetchError,
    mutate: mutateApiKeys,
  } = useSWR(`encrypted-api-keys-${userId}`, fetchEncryptedApiKeys, {
    revalidateOnMount: undefined,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: true,
    errorRetryCount: 2,
  });

  // Memoize encrypted API keys to prevent unnecessary re-decryption
  const stableEncryptedApiKeys = useMemo(() => {
    if (!encryptedApiKeys || Object.keys(encryptedApiKeys).length === 0) {
      return {};
    }
    return encryptedApiKeys;
  }, [JSON.stringify(encryptedApiKeys)]);

  // Initialize encryption key from user ID (consistent across devices/sessions)
  useEffect(() => {
    console.log("initializeEncryption");
    if (encryptionKey || !userId) return; // Skip if already set or no user ID

    async function initializeEncryption() {
      try {
        if (!isWebCryptoAvailable()) {
          console.error("Web Crypto API not available");
          return;
        }

        // Use user ID for encryption key derivation (consistent across sessions/devices)
        const key = await deriveEncryptionKey(userId);
        setEncryptionKey(key);
      } catch (error) {
        console.error("Error initializing encryption:", error);
      }
    }

    initializeEncryption();
  }, [userId, encryptionKey, setEncryptionKey]); // Include userId in dependencies

  // Decrypt API keys when encryption key or encrypted data changes
  useEffect(() => {
    console.log("decryptKeys");
    async function decryptKeys() {
      if (
        !encryptionKey ||
        !stableEncryptedApiKeys ||
        Object.keys(stableEncryptedApiKeys).length === 0
      ) {
        setDecryptedApiKeys({});
        return;
      }

      setIsDecrypting(true);
      try {
        const decrypted: ApiKeys = {};

        // Decrypt each API key
        for (const [provider, encryptedKey] of Object.entries(
          stableEncryptedApiKeys,
        )) {
          if (typeof encryptedKey === "string") {
            try {
              decrypted[provider as keyof ApiKeys] = await decryptApiKey(
                encryptedKey,
                encryptionKey,
              );
            } catch (error) {
              console.error(`Failed to decrypt ${provider} API key:`, error);
            }
          }
        }

        setDecryptedApiKeys(decrypted);
      } catch (error) {
        console.error("Error decrypting API keys:", error);
      } finally {
        setIsDecrypting(false);
      }
    }

    decryptKeys();
  }, [encryptionKey, stableEncryptedApiKeys]);

  // We're only loading if we don't have an encryption key
  // Once we have the key, decryption is fast enough to not block UI
  const isLoading = !encryptionKey;

  // Store API key function
  const storeApiKey = useCallback(
    async (
      provider: string,
      apiKey: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!encryptionKey) {
        return {
          success: false,
          error: "Encryption not available",
        };
      }

      try {
        // Encrypt the API key
        const encryptedKey = await encryptApiKey(apiKey, encryptionKey);

        // Store encrypted key in database
        const response = await fetch("/api/user/api-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            encryptedKey,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to store API key");
        }

        // Update SWR cache optimistically
        await mutateApiKeys();

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [encryptionKey, mutateApiKeys],
  );

  // Delete API key function
  const deleteApiKey = useCallback(
    async (provider: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch("/api/user/api-keys", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete API key");
        }

        // Update SWR cache
        await mutateApiKeys();

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [mutateApiKeys],
  );

  // Update multiple API keys
  const updateApiKeys = useCallback(
    async (newKeys: ApiKeys): Promise<{ success: boolean; error?: string }> => {
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
            const result = await deleteApiKey(provider);
            if (!result.success) {
              return result;
            }
          }
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [storeApiKey, deleteApiKey],
  );

  // Clear all API keys
  const clearAllApiKeys = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const providers = Object.keys(decryptedApiKeys);

      for (const provider of providers) {
        const result = await deleteApiKey(provider);
        if (!result.success) {
          return result;
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [decryptedApiKeys, deleteApiKey]);

  return {
    apiKeys: decryptedApiKeys,
    isLoading,
    storeApiKey,
    deleteApiKey,
    updateApiKeys,
    clearAllApiKeys,
    // Helper to check if a provider has an API key
    hasApiKey,
    isEncryptionAvailable: !!encryptionKey && isWebCryptoAvailable(),
    // SWR related
    error: fetchError,
    mutate: mutateApiKeys,
  };
}
