"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Search, Trash2, Loader2 } from "lucide-react";
import { useChatUrl } from "@/hooks/use-chat-url";
import { useChatLoading } from "@/hooks/use-chat-loading";
import {
  useConversations,
  deleteConversation,
} from "@/hooks/use-conversations";
import { Badge } from "@/components/ui/badge";
import { NewChatButton } from "@/components/chat/new-chat-button";
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

interface AppSidebarProps {
  userId: string;
}

export function AppSidebar({ userId }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { navigateToChat } = useChatUrl();
  const { isLoading: isChatLoading } = useChatLoading();
  const { data: conversations = [] } = useConversations(userId);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract chat ID from URL path
  const currentChatId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

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

      // If we're currently viewing the deleted conversation, redirect to chat page
      if (currentChatId === conversationId) {
        router.push("/chat");
      }

      toast.success("Conversation deleted successfully");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Sidebar variant="inset" className="w-64 flex-shrink-0 overflow-hidden">
      <SidebarHeader>
        <NewChatButton
          variant="default"
          size="sm"
          className="w-full justify-start"
        />
      </SidebarHeader>

      <SidebarContent className="flex flex-col overflow-hidden">
        <SidebarGroup className="flex-shrink-0">
          <SidebarGroupLabel>Search</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <SidebarInput
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
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
                <div className="w-full min-w-0 overflow-hidden p-2 pr-4">
                  {filteredConversations.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">
                      <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs">Start a new chat to get going</p>
                    </div>
                  ) : (
                    sortedGroups.map((groupName) => (
                      <div key={groupName} className="mb-2">
                        <div className="text-muted-foreground p-2 text-xs font-medium">
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
                                  asChild
                                  isActive={currentChatId === conversation.id}
                                  className="relative h-auto min-h-[3rem] w-full overflow-hidden p-3"
                                >
                                  <Link
                                    href={`/chat/${conversation.id}`}
                                    onMouseDown={() =>
                                      handleConversationClick(conversation.id)
                                    }
                                    className="block w-full overflow-hidden"
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
                                      <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
                                    )}
                                  </Link>
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
                <ScrollBar className="w-2" />
              </ScrollArea>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="text-muted-foreground text-center text-xs">
          <p>Built with ❤️ for T3 Chat Clone</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
