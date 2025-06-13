"use client";

import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useChatUrl() {
  const router = useRouter();
  const [chatId, setChatId] = useQueryState("id", {
    defaultValue: "",
    shallow: false,
  });

  const navigateToChat = useCallback(
    (id: string) => {
      if (id) {
        router.push(`/chat/${id}`);
      } else {
        router.push("/chat");
      }
    },
    [router],
  );

  const navigateToNewChat = useCallback(() => {
    router.push("/chat");
  }, [router]);

  return {
    chatId,
    setChatId,
    navigateToChat,
    navigateToNewChat,
  };
}
