import { SidebarProvider } from "@/components/ui/sidebar";

import { DashboardContent } from "./dashboard-content";
import { HeaderToolsOverlay } from "@/components/layout/header-tools-overlay";
import { SidebarTriggerWithNewChat } from "@/components/layout/sidebar-trigger-with-new-chat";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
        <Suspense fallback={null}>
          <SidebarTriggerWithNewChat />
        </Suspense>

        <Suspense fallback={null}>
          <HeaderToolsOverlay />
        </Suspense>
      </SidebarProvider>
    </div>
  );
}
