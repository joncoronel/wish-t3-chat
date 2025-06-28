"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useChatUrl } from "@/hooks/use-chat-url";

interface ChatPageClientProps {
  userId: string;
  initialChatId?: string;
}

export function ChatPageClient({ userId, initialChatId }: ChatPageClientProps) {
  const { chatId } = useChatUrl();

  // Use URL state if it has been set (including empty string for new chat)
  // Only fall back to initialChatId if URL parameter was never set (null)
  const activeChatId = chatId !== null ? chatId || undefined : initialChatId;

  return (
    <ChatInterface
      key={activeChatId || `new-chat-${userId}`}
      chatId={activeChatId}
      userId={userId}
      className="h-full"
    />
  );
}
