import { SidebarProvider } from "@/components/ui/sidebar";

import { DashboardContent } from "./dashboard-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
        {/* <SidebarTriggerWithNewChat />
          <HeaderToolsOverlay /> */}
      </SidebarProvider>
    </div>
  );
}
