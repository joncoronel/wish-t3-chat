"use client";

import {
  Search,
  Settings,
  Share,
  MoreHorizontal,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function HeaderToolsOverlay() {
  const pathname = usePathname();

  // Check if we're in a specific chat
  const isInChat = pathname.startsWith("/chat/") && pathname !== "/chat";
  const chatId = isInChat ? pathname.split("/chat/")[1] : null;

  const handleSettings = () => {
    // TODO: Implement settings
    console.log("Settings clicked");
  };

  const handleSearch = () => {
    // TODO: Implement search
    console.log("Search clicked");
  };

  const handleShareChat = () => {
    if (!chatId) {
      toast.error("No chat to share");
      return;
    }
    // TODO: Implement chat sharing
    toast.success(`Sharing chat: ${chatId}`);
  };

  const handleFeedback = () => {
    // TODO: Implement feedback
    console.log("Share feedback clicked");
  };

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-150 ease-[cubic-bezier(0.65,0,0.35,1)]",
        // Position at top-right with mobile-responsive spacing - closer to corners
        "top-2 right-2 sm:top-3 sm:right-3",
      )}
    >
      <div className="bg-background/95 flex items-center gap-1 rounded-lg border p-1 shadow-lg backdrop-blur-sm">
        {/* Search Button */}
        <Button
          onClick={handleSearch}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* More Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Share Chat - only show when in a specific chat */}
            {isInChat && (
              <>
                <DropdownMenuItem onClick={handleShareChat}>
                  <Share className="mr-2 h-4 w-4" />
                  Share Chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onClick={handleSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleFeedback}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Share Feedback
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
