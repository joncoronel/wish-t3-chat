"use client";

import { useEffect, useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useChatUrl } from "@/hooks/use-chat-url";

interface ChatPageClientProps {
  userId: string;
  initialChatId?: string;
}

export function ChatPageClient({ userId, initialChatId }: ChatPageClientProps) {
  const { chatId, setChatId } = useChatUrl();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync the initial server-side chatId with the client-side state on first load
  useEffect(() => {
    if (initialChatId && !hasInitialized) {
      setChatId(initialChatId);
      setHasInitialized(true);
    } else if (!initialChatId && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [initialChatId, hasInitialized, setChatId]);

  // After initialization, use the client-side chatId exclusively
  const activeChatId = hasInitialized ? chatId : initialChatId;

  // Let SWR handle all data fetching through the ChatInterface and its hooks
  return (
    <ChatInterface chatId={activeChatId} userId={userId} className="h-full" />
  );
}
