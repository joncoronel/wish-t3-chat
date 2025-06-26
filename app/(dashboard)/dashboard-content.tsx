import { Suspense } from "react";
import { SWRConfig } from "swr";

import { AppSidebarSkeleton } from "@/components/app-sidebar-skeleton";
import { SidebarInset } from "@/components/ui/sidebar";

import { ChatInputSection } from "./chat/chat-input-section";
import AppSidebarServer from "@/components/app-sidebar-server";

export async function DashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch data on the server for performance - using unified settings fetch

  return (
    <SWRConfig>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <AppSidebarServer />
      </Suspense>
      <SidebarInset className="flex flex-col overflow-clip">
        <main className="flex-1 overflow-hidden">
          <div className="relative flex h-full flex-col">
            {/* Content Area - This changes based on route with its own scroll */}
            <div className="min-h-0 flex-1">{children}</div>

            {/* Input - Floating overlay at bottom */}
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10">
              {/* Gradient background that avoids custom scrollbar area - no pointer events */}
              <div className="from-background via-background/95 absolute inset-0 right-3 bg-gradient-to-t to-transparent pt-6" />
              {/* Input wrapper - only this should capture pointer events */}

              <Suspense fallback={null}>
                <ChatInputSection />
              </Suspense>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SWRConfig>
  );
}
