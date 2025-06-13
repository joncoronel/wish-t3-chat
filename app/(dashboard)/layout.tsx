import { redirect } from "next/navigation";
import { SWRConfig } from "swr";
import { getUser } from "@/lib/auth";
import { getConversations } from "@/lib/data/conversations";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

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
      <div className="flex h-full flex-col">
        <Header user={user} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar userId={user.id} />
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SWRConfig>
  );
}
