"use client";

import { useAtom } from "jotai";
import { Menu, Settings, Share, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  toggleSidebarAtom,
  isNewChatModalOpenAtom,
  isSettingsModalOpenAtom,
} from "@/store";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const [, toggleSidebar] = useAtom(toggleSidebarAtom);
  const [, setNewChatModalOpen] = useAtom(isNewChatModalOpenAtom);
  const [, setSettingsModalOpen] = useAtom(isSettingsModalOpenAtom);
  const { user, signOut } = useAuth();

  const handleNewChat = () => {
    setNewChatModalOpen(true);
  };

  const handleSettings = () => {
    setSettingsModalOpen(true);
  };

  return (
    <header className="bg-background flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Wish T3 Chat</h1>
          <Badge variant="secondary" className="text-xs">
            Beta
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search button - will be implemented in later phases */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        {/* New chat button */}
        <Button variant="ghost" size="sm" onClick={handleNewChat}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.full_name
                      ? user.full_name.charAt(0).toUpperCase()
                      : user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">
                    {user.full_name || "User"}
                  </p>
                  <p className="text-muted-foreground text-xs leading-none">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="mr-2 h-4 w-4" />
                Share Feedback
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
