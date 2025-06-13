import { redirect } from "next/navigation";
import { SWRConfig } from "swr";
import { getUser } from "@/lib/auth";
import { getConversations } from "@/lib/data/conversations";
import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

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
      }}
    >
      <div className="flex h-screen">
        <SidebarProvider>
          <AppSidebar userId={user.id} />
          <SidebarInset className="flex flex-col overflow-clip">
            <Header user={user} />
            <main className="flex-1 overflow-hidden">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </SWRConfig>
  );
}
