import { atom } from "jotai";

export type ApiKeys = {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
};

// Core atom for decrypted API keys only
export const decryptedApiKeysAtom = atom<ApiKeys>({});

// Atom for the encryption key (derived from session)
export const encryptionKeyAtom = atom<CryptoKey | null>(null);

// Loading state for decryption process
export const isDecryptingAtom = atom<boolean>(false);

// Helper atom to check if a provider has an API key
export const hasApiKeyAtom = atom((get) => (provider: string) => {
  const apiKeys = get(decryptedApiKeysAtom);
  return !!(apiKeys as Record<string, string>)[provider];
});
