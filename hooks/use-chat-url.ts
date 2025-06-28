"use client";

import { useQueryState } from "nuqs";
import { useCallback } from "react";

export function useChatUrl() {
  const [chatId, setChatId] = useQueryState("id", {
    shallow: true,
    history: "push",
  });

  const navigateToChat = useCallback(
    (id: string) => {
      if (id) {
        setChatId(id);
      } else {
        setChatId("");
      }
    },
    [setChatId],
  );

  const navigateToNewChat = useCallback(() => {
    setChatId("");
  }, [setChatId]);

  return {
    chatId,
    setChatId,
    navigateToChat,
    navigateToNewChat,
  };
}
