import { redirect } from "next/navigation";
import { SWRConfig } from "swr";
import { createClient } from "@/lib/supabase/server";
import { getConversation, getMessages } from "@/lib/data/conversations";
import { ChatPageClient } from "./chat-page-client";

interface ChatPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const { id: chatId } = await searchParams;

  // If we have a chat ID, prefetch the data on the server for initial load
  if (chatId) {
    const conversationPromise = getConversation(chatId, data.user.id);
    const messagesPromise = getMessages(chatId);

    const fallbackData: Record<string, unknown> = {
      [`conversation-${chatId}-${data.user.id}`]: conversationPromise,
      [`messages-${chatId}`]: messagesPromise,
    };

    return (
      <SWRConfig
        value={{
          fallback: fallbackData,
        }}
      >
        <ChatPageClient initialChatId={chatId} userId={data.user.id} />
      </SWRConfig>
    );
  }

  // No chat ID - render the welcome screen
  return <ChatPageClient userId={data.user.id} />;
}
