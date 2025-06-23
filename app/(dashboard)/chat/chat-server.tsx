import { redirect } from "next/navigation";
import { SWRConfig } from "swr";

import { getConversation, getMessages } from "@/lib/data/conversations";
import { ChatPageClient } from "./chat-page-client";
import { getUser } from "@/lib/auth";

interface ChatPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ChatServer({ searchParams }: ChatPageProps) {
  //artificial delay
  //   await new Promise((resolve) => setTimeout(resolve, 2000));

  const { id: chatId } = await searchParams;
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // If we have a chat ID, prefetch the data on the server for initial load
  if (chatId) {
    const conversationPromise = getConversation(chatId, user.id);
    const messagesPromise = getMessages(chatId);

    const fallbackData: Record<string, unknown> = {
      [`conversation-${chatId}-${user.id}`]: conversationPromise,
      [`messages-${chatId}`]: messagesPromise,
    };

    return (
      <SWRConfig
        value={{
          fallback: fallbackData,
        }}
      >
        <ChatPageClient initialChatId={chatId} userId={user.id} />
      </SWRConfig>
    );
  }

  // No chat ID - render the welcome screen
  return <ChatPageClient userId={user.id} />;
}
