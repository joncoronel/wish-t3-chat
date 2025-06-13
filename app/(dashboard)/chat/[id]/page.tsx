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

  // Fetch conversation and messages on the server
  const [conversation, messages] = await Promise.all([
    getConversation(id, data.user.id),
    getMessages(id),
  ]);

  // If conversation doesn't exist or doesn't belong to user, redirect
  if (!conversation) {
    redirect("/chat");
  }

  return (
    <SWRConfig
      value={{
        fallback: {
          [`conversation-${id}-${data.user.id}`]: conversation,
          [`messages-${id}`]: messages,
        },
      }}
    >
      <ChatInterface chatId={id} userId={data.user.id} className="h-full" />
    </SWRConfig>
  );
}
