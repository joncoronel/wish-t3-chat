"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useChatUrl } from "@/hooks/use-chat-url";

interface ChatPageClientProps {
  userId: string;
  initialChatId?: string;
}

export function ChatPageClient({ userId, initialChatId }: ChatPageClientProps) {
  const { chatId } = useChatUrl();

  // Use URL state if available, otherwise fall back to initial
  const activeChatId = chatId || initialChatId;

  return (
    <ChatInterface
      key={activeChatId || `new-chat-${userId}`}
      chatId={activeChatId || undefined}
      userId={userId}
      className="h-full"
    />
  );
}
