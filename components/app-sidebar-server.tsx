import { getConversations } from "@/lib/data/conversations";
import { getUser } from "@/lib/auth";
import { AppSidebar } from "./app-sidebar";
import { SWRConfig } from "swr";

export default async function AppSidebarServer() {
  const user = await getUser();
  const userId = user?.id;

  if (!userId) {
    return null;
  }

  const conversations = getConversations(userId);

  return (
    <SWRConfig
      value={{
        fallback: {
          [`conversations-${userId}`]: conversations,
        },
      }}
    >
      <AppSidebar userId={userId} user={user} />
    </SWRConfig>
  );
}
