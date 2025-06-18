import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Type for API keys
export type ApiKeys = {
  openai?: string;
  anthropic?: string;
  google?: string;
  openrouter?: string;
};

// Local storage atom for API keys
export const localApiKeysAtom = atomWithStorage<ApiKeys>("api-keys", {});

// Helper atom to clear all API keys
export const clearApiKeysAtom = atom(null, (get, set) => {
  set(localApiKeysAtom, {});
});
