import { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarTriggerWithNewChat } from "@/components/layout/sidebar-trigger-with-new-chat";
import { HeaderToolsOverlay } from "@/components/layout/header-tools-overlay";
import { AppSidebarSkeleton } from "@/components/app-sidebar-skeleton";
import { DashboardContent } from "./dashboard-content";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <Suspense
          fallback={
            <>
              <AppSidebarSkeleton />
              <SidebarInset className="flex flex-col overflow-clip">
                <main className="flex-1 overflow-hidden">
                  <div className="flex h-full items-center justify-center">
                    <Spinner variant="circle-filled" />
                  </div>
                </main>
              </SidebarInset>
            </>
          }
        >
          <DashboardContent>{children}</DashboardContent>
          <SidebarTriggerWithNewChat />
          <HeaderToolsOverlay />
        </Suspense>
      </SidebarProvider>
    </div>
  );
}
