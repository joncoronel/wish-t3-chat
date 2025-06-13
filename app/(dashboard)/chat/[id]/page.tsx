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

  // Try to fetch conversation and messages on the server
  const [conversation, messages] = await Promise.all([
    getConversation(id, data.user.id),
    getMessages(id),
  ]);

  // For new conversations that don't exist yet, let the client handle it
  // Only redirect if there's a real error (not just missing conversation)
  const fallbackData: Record<string, unknown> = {};

  if (conversation) {
    fallbackData[`conversation-${id}-${data.user.id}`] = conversation;
  }

  if (messages) {
    fallbackData[`messages-${id}`] = messages;
  }

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
