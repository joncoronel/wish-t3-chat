import { atom } from "jotai";

// Store for tracking the active branch per conversation
export const conversationBranchesAtom = atom<Record<string, string>>({});

// Cache for atoms to prevent creating new atoms on every render
const activeBranchAtomCache = new Map<string, any>();

// Derived atom for getting the active branch for a specific conversation
export const getActiveBranchAtom = (conversationId: string) => {
  if (!activeBranchAtomCache.has(conversationId)) {
    const branchAtom = atom(
      (get) => get(conversationBranchesAtom)[conversationId] || "main",
      (get, set, branchName: string) => {
        const current = get(conversationBranchesAtom);
        set(conversationBranchesAtom, {
          ...current,
          [conversationId]: branchName,
        });
      },
    );
    activeBranchAtomCache.set(conversationId, branchAtom);
  }
  return activeBranchAtomCache.get(conversationId)!;
};

// Atom for tracking if branch management UI is open
export const branchPanelOpenAtom = atom(false);

// Atom for tracking which conversation's branches are being viewed
export const activeBranchConversationAtom = atom<string | null>(null);
