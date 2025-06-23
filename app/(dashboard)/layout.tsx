import { redirect } from "next/navigation";
import { SWRConfig } from "swr";
import { getUser } from "@/lib/auth";
import { getConversations } from "@/lib/data/conversations";
import { getUserSettingsData } from "@/lib/data/user-preferences";
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
    redirect("/login");
  }

  // Fetch data on the server for performance - using unified settings fetch
  const conversationsPromise = getConversations(user.id);
  const userSettingsPromise = getUserSettingsData(user.id);

  return (
    <SWRConfig
      value={{
        fallback: {
          [`conversations-${user.id}`]: conversationsPromise,
          [`encrypted-api-keys-${user.id}`]: userSettingsPromise.then(
            (data) => data.apiKeys,
          ),
          [`user-preferences-${user.id}`]: userSettingsPromise.then(
            (data) => data.preferences,
          ),
        },
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
