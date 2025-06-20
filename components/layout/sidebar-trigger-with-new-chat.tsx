"use client";

import { PanelLeftIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useChatUrl } from "@/hooks/use-chat-url";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function SidebarTriggerWithNewChat() {
  const { toggleSidebar, state, setOpenMobile } = useSidebar();
  const { navigateToNewChat } = useChatUrl();
  const isMobile = useIsMobile();

  const handleNewChat = () => {
    navigateToNewChat();
  };

  // Force sidebar to be collapsed on mobile
  useEffect(() => {
    if (isMobile && state === "expanded") {
      setOpenMobile(false);
    }
  }, [isMobile, state, setOpenMobile]);

  // On mobile, always show as collapsed state
  const isCollapsed = isMobile || state === "collapsed";

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-150 ease-[cubic-bezier(0.65,0,0.35,1)]",
        // Mobile-first positioning - closer to corners
        isCollapsed
          ? "top-2 left-2 sm:top-3 sm:left-3"
          : "top-4 left-4 sm:top-5 sm:left-6",
      )}
    >
      <div
        className={cn(
          "bg-card/95 flex items-center rounded-lg border transition-all duration-150 ease-[cubic-bezier(0.65,0,0.35,1)]",
          isCollapsed ? "gap-1 border p-1 shadow-lg backdrop-blur-sm" : "gap-0",
        )}
      >
        {/* Sidebar Toggle Button */}
        <Button
          onClick={toggleSidebar}
          variant={isCollapsed ? "ghost" : "outline"}
          size={isCollapsed ? "icon" : "sm"}
          className={cn(
            "h-8 w-8 transition-all duration-150 ease-[cubic-bezier(0.65,0,0.35,1)]",
            !isCollapsed && "bg-card rounded-lg border p-0 shadow-md",
          )}
        >
          <PanelLeftIcon className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {/* New Chat Button - Always visible on mobile */}
        <div
          className={cn(
            "transition-all duration-150 ease-[cubic-bezier(0.65,0,0.35,1)]",
            isCollapsed
              ? "translate-x-0 scale-100 opacity-100"
              : "w-0 -translate-x-2 scale-0 overflow-hidden opacity-0",
          )}
        >
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">New chat</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
