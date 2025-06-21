"use client";

import { useState } from "react";

import {
  MessageSquare,
  Search,
  Trash2,
  Loader2,
  Settings,
  Share,
  Plus,
} from "lucide-react";
import { useChatUrl } from "@/hooks/use-chat-url";
import { useChatLoading } from "@/hooks/use-chat-loading";
import {
  useConversations,
  deleteConversation,
} from "@/hooks/use-conversations";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth/actions";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  userId: string;
  user: User;
}

export function AppSidebar({ userId, user }: AppSidebarProps) {
  const {
    chatId: currentChatId,
    navigateToChat,
    navigateToNewChat,
  } = useChatUrl();
  const { isLoading: isChatLoading } = useChatLoading();
  const { data: conversations = [] } = useConversations(userId);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.model.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce(
    (groups, conversation) => {
      const date = new Date(conversation.updated_at);
      const now = new Date();

      // Get start of today (midnight)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      // Get start of yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      // Get start of this week (assuming week starts on Sunday)
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      // Get start of this month
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let groupKey: string;
      if (date >= today) {
        groupKey = "Today";
      } else if (date >= yesterday) {
        groupKey = "Yesterday";
      } else if (date >= thisWeekStart) {
        groupKey = "This Week";
      } else if (date >= thisMonthStart) {
        groupKey = "This Month";
      } else {
        groupKey = "Older";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conversation);
      return groups;
    },
    {} as Record<string, typeof conversations>,
  );

  // Sort groups by priority
  const groupOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"];
  const sortedGroups = groupOrder.filter(
    (group) => groupedConversations[group]?.length > 0,
  );

  const handleConversationClick = (conversationId: string) => {
    navigateToChat(conversationId);
  };

  const handleDelete = async (conversationId: string) => {
    setDeletingId(conversationId);
    try {
      await deleteConversation(conversationId, userId, conversations);

      // If we're currently viewing the deleted conversation, navigate to new chat
      if (currentChatId === conversationId) {
        navigateToNewChat();
      }

      toast.success("Conversation deleted successfully");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSettings = () => {
    window.location.href = "/settings";
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar variant="floating" className="w-64 flex-shrink-0 overflow-hidden">
      <SidebarHeader>
        <div className="text-sidebar-foreground py-2 text-center text-sm font-medium">
          Wish T3 Chat
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col overflow-hidden">
        {/* New Chat Button Section */}
        <div className="flex-shrink-0 p-2">
          <Button
            onClick={navigateToNewChat}
            className="bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 h-9 w-full justify-start gap-2"
            variant="default"
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
              <SidebarInput
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-sidebar-accent/80 border-sidebar-border/50 text-sidebar-foreground placeholder:text-sidebar-foreground/70 focus-visible:bg-sidebar-accent focus-visible:border-sidebar-border focus-visible:ring-sidebar-foreground/20 border pl-8 focus-visible:ring-1"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="min-h-0 flex-1 overflow-hidden p-0">
          <SidebarGroupLabel className="px-2 py-2">
            Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1 overflow-hidden p-0">
            <div className="h-full w-full overflow-hidden">
              <ScrollArea
                className="h-full w-full"
                hideScrollbar={true}
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent, #000 20px, #000 calc(100% - 20px), transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent, #000 20px, #000 calc(100% - 20px), transparent 100%)",
                }}
              >
                <div className="w-full min-w-0 overflow-hidden p-2">
                  {filteredConversations.length === 0 ? (
                    <div className="text-sidebar-foreground/70 py-8 text-center">
                      <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs">Start a new chat to get going</p>
                    </div>
                  ) : (
                    sortedGroups.map((groupName) => (
                      <div key={groupName} className="mb-2">
                        <div className="text-sidebar-foreground/70 p-2 text-xs font-medium">
                          {groupName}
                        </div>
                        <SidebarMenu className="overflow-hidden">
                          {groupedConversations[groupName].map(
                            (conversation) => (
                              <SidebarMenuItem
                                key={conversation.id}
                                className="mb-1 overflow-hidden"
                              >
                                <SidebarMenuButton
                                  isActive={currentChatId === conversation.id}
                                  className="relative h-auto min-h-[3rem] w-full cursor-pointer overflow-hidden p-3"
                                  onMouseDown={() =>
                                    handleConversationClick(conversation.id)
                                  }
                                >
                                  <div className="flex w-full min-w-0 items-center overflow-hidden">
                                    <span className="min-w-0 flex-1 truncate text-sm leading-tight font-medium">
                                      {conversation.title || "Untitled Chat"}
                                    </span>
                                    {conversation.is_shared && (
                                      <div className="ml-2 flex-shrink-0">
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Shared
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  {isChatLoading(conversation.id) && (
                                    <Loader2 className="text-sidebar-foreground/70 absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
                                  )}
                                </SidebarMenuButton>
                                <AlertDialog>
                                  <SidebarMenuAction showOnHover asChild>
                                    <AlertDialogTrigger>
                                      <Trash2 className="h-4 w-4" />
                                    </AlertDialogTrigger>
                                  </SidebarMenuAction>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Conversation
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete &ldquo;
                                        {conversation.title || "Untitled Chat"}
                                        &rdquo;? This action cannot be undone
                                        and will permanently remove the
                                        conversation and all its messages.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel
                                        disabled={
                                          deletingId === conversation.id
                                        }
                                      >
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(conversation.id)
                                        }
                                        disabled={
                                          deletingId === conversation.id
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {deletingId === conversation.id
                                          ? "Deleting..."
                                          : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </SidebarMenuItem>
                            ),
                          )}
                        </SidebarMenu>
                      </div>
                    ))
                  )}
                </div>
                <ScrollBar className="w-1.5 transition-[width] duration-200 ease-out hover:w-2 data-[state=dragging]:w-2" />
              </ScrollArea>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-2">
          {/* User Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:bg-sidebar-accent hover:text-sidebar-foreground text-sidebar-foreground flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user.user_metadata?.full_name
                      ? user.user_metadata.full_name.charAt(0).toUpperCase()
                      : user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {user.user_metadata?.full_name || "User"}
                  </p>
                  <p className="text-sidebar-foreground/70 truncate text-xs">
                    {user.email}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">
                    {user.user_metadata?.full_name || "User"}
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
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
