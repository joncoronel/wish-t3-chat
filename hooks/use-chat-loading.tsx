"use client";

import { atom, useAtom } from "jotai";

// Atom to store the set of loading chat IDs
const loadingChatsAtom = atom<Set<string>>(new Set<string>());

// Derived atom for setting loading state
const setLoadingAtom = atom(
  null,
  (get, set, { chatId, isLoading }: { chatId: string; isLoading: boolean }) => {
    const currentLoadingChats = get(loadingChatsAtom);
    const newLoadingChats = new Set(currentLoadingChats);

    if (isLoading) {
      newLoadingChats.add(chatId);
    } else {
      newLoadingChats.delete(chatId);
    }

    set(loadingChatsAtom, newLoadingChats);
  },
);

// Derived atom for checking if a chat is loading
const isLoadingAtom = atom(null, (get, _set, chatId: string) => {
  const loadingChats = get(loadingChatsAtom);
  return loadingChats.has(chatId);
});

export function useChatLoading() {
  const [, setLoadingState] = useAtom(setLoadingAtom);
  const [, checkIsLoading] = useAtom(isLoadingAtom);

  const setLoading = (chatId: string, isLoading: boolean) => {
    setLoadingState({ chatId, isLoading });
  };

  const isLoading = (chatId: string) => {
    return checkIsLoading(chatId);
  };

  return { setLoading, isLoading };
}
