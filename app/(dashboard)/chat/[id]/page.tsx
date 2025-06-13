import { redirect } from "next/navigation";
import { SWRConfig } from "swr";
import { createClient } from "@/lib/supabase/server";
import { getConversation, getMessages } from "@/lib/data/conversations";
import { ChatInterface } from "@/components/chat/chat-interface";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Start fetching conversation and messages on the server (but don't await)
  const conversationPromise = getConversation(id, data.user.id);
  const messagesPromise = getMessages(id);

  // For new conversations that don't exist yet, let the client handle it
  // Only redirect if there's a real error (not just missing conversation)
  const fallbackData: Record<string, unknown> = {
    [`conversation-${id}-${data.user.id}`]: conversationPromise,
    [`messages-${id}`]: messagesPromise,
  };

  return (
    <SWRConfig
      value={{
        fallback: fallbackData,
      }}
    >
      <ChatInterface chatId={id} userId={data.user.id} className="h-full" />
    </SWRConfig>
  );
}
