import { SWRConfig } from "swr";
import { getUser } from "@/lib/auth";
import { getConversation, getMessages } from "@/lib/data/conversations";
import { ChatInterface } from "@/components/chat/chat-interface";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    // This should be handled by parent layout, but just in case
    return null;
  }

  // Start fetching conversation and messages on the server (but don't await)
  const conversationPromise = getConversation(id, user.id);
  const messagesPromise = getMessages(id);

  // For new conversations that don't exist yet, let the client handle it
  // Only redirect if there's a real error (not just missing conversation)
  const fallbackData: Record<string, unknown> = {
    [`conversation-${id}-${user.id}`]: conversationPromise,
    [`messages-${id}`]: messagesPromise,
  };

  return (
    <SWRConfig
      value={{
        fallback: fallbackData,
      }}
    >
      <ChatInterface chatId={id} userId={user.id} className="h-full" />
    </SWRConfig>
  );
}
