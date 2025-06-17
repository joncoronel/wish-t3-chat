import { redirect } from "next/navigation";
import { SWRConfig } from "swr";
import { getUser } from "@/lib/auth";
import { getConversations } from "@/lib/data/conversations";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarTriggerWithNewChat } from "@/components/layout/sidebar-trigger-with-new-chat";
import { HeaderToolsOverlay } from "@/components/layout/header-tools-overlay";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch conversations on the server
  const conversations = await getConversations(user.id);

  return (
    <SWRConfig
      value={{
        fallback: {
          [`conversations-${user.id}`]: conversations,
        },
        // Global SWR configuration to prevent unnecessary fetches
        revalidateOnMount: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000, // 1 minute
        // focusThrottleInterval: 60000, // 1 minute
      }}
    >
      <div className="flex h-screen">
        <SidebarProvider>
          <AppSidebar userId={user.id} user={user} />
          <SidebarInset className="flex flex-col overflow-clip">
            <main className="flex-1 overflow-hidden">{children}</main>
          </SidebarInset>
          <SidebarTriggerWithNewChat />
          <HeaderToolsOverlay />
        </SidebarProvider>
      </div>
    </SWRConfig>
  );
}
