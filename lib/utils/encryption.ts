/**
 * Client-side encryption utilities for API keys
 * Uses Web Crypto API with user-ID-derived encryption keys for cross-device compatibility
 */

// Derive encryption key from user ID (consistent across devices/sessions)
export async function deriveEncryptionKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(userId),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("wish-t3-chat-api-keys"), // Static salt for consistency
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// Encrypt API key
export async function encryptApiKey(
  apiKey: string,
  encryptionKey: CryptoKey,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);

  // Generate random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    data,
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Return as base64 string
  return btoa(String.fromCharCode(...combined));
}

// Decrypt API key
export async function decryptApiKey(
  encryptedData: string,
  encryptionKey: CryptoKey,
): Promise<string> {
  try {
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((char) => char.charCodeAt(0)),
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      encryptionKey,
      encrypted,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    throw new Error("Failed to decrypt API key");
  }
}

// Helper to check if Web Crypto API is available
export function isWebCryptoAvailable(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.subtle.encrypt === "function"
  );
}
