import { SidebarProvider } from "@/components/ui/sidebar";

import { DashboardContent } from "./dashboard-content";
import { SidebarTriggerWithNewChat } from "@/components/layout/sidebar-trigger-with-new-chat";

import { Suspense } from "react";
import HeaderToolsOverlayWrapper from "@/components/layout/header-tools-overlay-wrapper";

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
          <HeaderToolsOverlayWrapper />
        </Suspense>
      </SidebarProvider>
    </div>
  );
}
