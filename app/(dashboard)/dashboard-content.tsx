import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SWRConfig } from "swr";
import { getUser } from "@/lib/auth";
import { getConversations } from "@/lib/data/conversations";
import { getUserSettingsData } from "@/lib/data/user-preferences";
import { AppSidebarSkeleton } from "@/components/app-sidebar-skeleton";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export async function DashboardContent({
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
      <Suspense fallback={<AppSidebarSkeleton />}>
        <AppSidebar userId={user.id} user={user} />
      </Suspense>
      <SidebarInset className="flex flex-col overflow-clip">
        <main className="flex-1 overflow-hidden">{children}</main>
      </SidebarInset>
    </SWRConfig>
  );
}
