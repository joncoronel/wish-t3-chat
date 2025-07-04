"use client";

import { useState } from "react";
import Link from "next/link";

import {
  MessageSquare,
  Search,
  Trash2,
  Loader2,
  Settings,
  Share,
  Plus,
  Users,
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

      let groupKey: string;

      if (date >= today) {
        groupKey = "Today";
      } else if (date >= yesterday) {
        groupKey = "Yesterday";
      } else {
        // For older dates, calculate the difference in calendar days
        const conversationDateOnly = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        const diffTime = today.getTime() - conversationDateOnly.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 6) {
          // Handles 2-6 days ago
          groupKey = `${diffDays} days ago`;
        } else if (diffDays <= 29) {
          // Handles 1-4 weeks ago
          const weeks = Math.floor(diffDays / 7);
          groupKey = weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
        } else {
          // Handle months and years ago
          const conversationMonth = date.getMonth();
          const conversationYear = date.getFullYear();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          const monthsDiff =
            (currentYear - conversationYear) * 12 +
            (currentMonth - conversationMonth);

          if (monthsDiff === 1) {
            groupKey = "Last month";
          } else if (monthsDiff < 12) {
            groupKey = `${monthsDiff} months ago`;
          } else {
            const years = Math.floor(monthsDiff / 12);
            groupKey = years === 1 ? "1 year ago" : `${years} years ago`;
          }
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conversation);
      return groups;
    },
    {} as Record<string, typeof conversations>,
  );

  // Define the order of groups for sorting
  const groupOrder = [
    "Today",
    "Yesterday",
    "2 days ago",
    "3 days ago",
    "4 days ago",
    "5 days ago",
    "6 days ago",
    "1 week ago",
    "2 weeks ago",
    "3 weeks ago",
    "4 weeks ago",
    "Last month",
    "2 months ago",
    "3 months ago",
    "4 months ago",
    "5 months ago",
    "6 months ago",
    "7 months ago",
    "8 months ago",
    "9 months ago",
    "10 months ago",
    "11 months ago",
    "1 year ago",
    "2 years ago",
    "3 years ago",
    "4 years ago",
    "5 years ago",
  ];

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

  const handleSignOut = async () => {
    await signOut();
  };

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
            onClick={navigateToNewChat}
            className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 h-9 w-full justify-start gap-2"
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
                className="bg-sidebar-accent/80 border-sidebar-border/50 text-sidebar-foreground placeholder:text-sidebar-foreground/70 focus-visible:bg-sidebar-accent focus-visible:border-sidebar-border focus-visible:ring-sidebar-ring border pl-8 focus-visible:ring-1"
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
                                className="group/item mb-1 overflow-hidden"
                              >
                                <div className="group-hover/item:bg-sidebar-accent/50 relative flex items-center rounded-md transition-colors duration-150">
                                  <SidebarMenuButton
                                    isActive={currentChatId === conversation.id}
                                    className="relative h-auto min-h-[3rem] w-full cursor-pointer overflow-hidden p-3 pr-14 hover:bg-transparent"
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

                                  {/* Delete Button */}
                                  <div className="absolute top-1/2 right-2 z-10 -translate-y-1/2">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button
                                          className="text-sidebar-foreground/60 hover:bg-destructive/20 hover:text-destructive focus:ring-destructive/50 flex h-7 w-7 translate-x-2 transform-gpu items-center justify-center rounded-md opacity-0 transition-all duration-150 ease-in-out group-hover/item:translate-x-0 group-hover/item:opacity-100 focus:translate-x-0 focus:opacity-100 focus:ring-2 focus:outline-none"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Conversation
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete
                                            &ldquo;
                                            {conversation.title ||
                                              "Untitled Chat"}
                                            &rdquo;? This action cannot be
                                            undone and will permanently remove
                                            the conversation and all its
                                            messages.
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
                                  </div>
                                </div>
                              </SidebarMenuItem>
                            ),
                          )}
                        </SidebarMenu>
                      </div>
                    ))
                  )}
                </div>
                <ScrollBar className="[&>div]:bg-border dark:[&>div]:bg-sidebar-accent w-1.5 transition-[width] duration-200 ease-out hover:w-2 data-[state=dragging]:w-2" />
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
              <DropdownMenuItem asChild>
                <Link href="/settings/general">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/personas">
                  <Users className="mr-2 h-4 w-4" />
                  AI Personas
                </Link>
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
