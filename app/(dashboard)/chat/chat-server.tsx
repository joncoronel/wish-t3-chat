import { redirect } from "next/navigation";
import { SWRConfig } from "swr";

import { getMessages } from "@/lib/data/conversations";
import { ChatPageClient } from "./chat-page-client";
import { getUser } from "@/lib/auth";
import { getConversations } from "@/lib/data/conversations";
import { getUserSettingsData } from "@/lib/data/user-preferences";

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

  const conversations = await getConversations(user.id);
  const { apiKeys, preferences } = await getUserSettingsData(user.id);

  // If we have a chat ID, prefetch the data on the server for initial load
  if (chatId) {
    const messagesPromise = getMessages(chatId);

    const fallbackData: Record<string, unknown> = {
      [`messages-${chatId}-main`]: messagesPromise,
      [`encrypted-api-keys-${user.id}`]: apiKeys,
      [`user-preferences-${user.id}`]: preferences,
      [`conversations-${user.id}`]: conversations,
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

  const fallbackData: Record<string, unknown> = {
    [`encrypted-api-keys-${user.id}`]: apiKeys,
    [`user-preferences-${user.id}`]: preferences,
    [`conversations-${user.id}`]: conversations,
  };

  // No chat ID - render the welcome screen
  return (
    <SWRConfig value={{ fallback: fallbackData }}>
      <ChatPageClient userId={user.id} />
    </SWRConfig>
  );
}
