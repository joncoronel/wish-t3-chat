import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConversations } from "@/lib/data/conversations";
import { getUserSettingsData } from "@/lib/data/user-preferences";
import { SWRConfig } from "swr";
import { ChatInputSectionClient } from "@/components/chat/chat-input-section-client";

export async function ChatInputSection() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const conversations = await getConversations(user.id);
  const { apiKeys, preferences } = await getUserSettingsData(user.id);

  return (
    <SWRConfig
      value={{
        fallback: {
          [`encrypted-api-keys-${user.id}`]: apiKeys,
          [`user-preferences-${user.id}`]: preferences,
          [`conversations-${user.id}`]: conversations,
        },
      }}
    >
      <ChatInputSectionClient userId={user.id} />
    </SWRConfig>
  );
}
