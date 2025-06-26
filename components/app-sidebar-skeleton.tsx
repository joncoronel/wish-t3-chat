import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export function AppSidebarSkeleton() {
  return (
    <Sidebar variant="inset" className="w-64 flex-shrink-0 overflow-hidden">
      <SidebarHeader>
        <div className="text-sidebar-foreground py-2 text-center text-sm font-medium">
          Cubby Chat
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col overflow-hidden">
        {/* New Chat Button Section */}
        <div className="flex-shrink-0 p-2">
          <Button
            className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 h-9 w-full justify-start gap-2"
            variant="default"
            disabled
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>

        <SidebarGroup className="flex-shrink-0">
          <SidebarGroupLabel>Search</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="relative">
              <Search className="text-sidebar-foreground/50 absolute top-2.5 left-2 h-4 w-4" />
              <div className="bg-sidebar-accent/80 h-9 w-full rounded-md pl-8" />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="min-h-0 flex-1 overflow-hidden p-0">
          <SidebarGroupLabel className="px-2 py-2">
            Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1 overflow-hidden p-0">
            <div className="h-full w-full overflow-hidden p-2">
              {/* Date groups skeleton */}
              <div className="space-y-4">
                {/* Today section */}
                <div>
                  <div className="bg-sidebar-accent/60 mb-2 h-4 w-12 rounded-md" />
                  <SidebarMenu>
                    {[...Array(2)].map((_, i) => (
                      <SidebarMenuItem key={i} className="mb-1">
                        <div className="bg-sidebar-accent/50 h-12 w-full rounded-md" />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>

                {/* Yesterday section */}
                <div>
                  <div className="bg-sidebar-accent/60 mb-2 h-4 w-16 rounded-md" />
                  <SidebarMenu>
                    {[...Array(3)].map((_, i) => (
                      <SidebarMenuItem key={i} className="mb-1">
                        <div className="bg-sidebar-accent/50 h-12 w-full rounded-md" />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>

                {/* Older section */}
                <div>
                  <div className="bg-sidebar-accent/60 mb-2 h-4 w-20 rounded-md" />
                  <SidebarMenu>
                    {[...Array(2)].map((_, i) => (
                      <SidebarMenuItem key={i} className="mb-1">
                        <div className="bg-sidebar-accent/50 h-12 w-full rounded-md" />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-2">
          {/* User Account Skeleton */}
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="bg-sidebar-accent/60 h-8 w-8 rounded-full" />
            <div className="flex-1">
              <div className="bg-sidebar-accent/60 mb-1 h-4 w-24 rounded-md" />
              <div className="bg-sidebar-accent/50 h-3 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
