"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Search, Trash2 } from "lucide-react";
import { useChatUrl } from "@/hooks/use-chat-url";
import {
  useConversations,
  deleteConversation,
} from "@/hooks/use-conversations";
import { Badge } from "@/components/ui/badge";
import { NewChatButton } from "@/components/chat/new-chat-button";
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <NewChatButton
          variant="default"
          size="sm"
          className="w-full justify-start"
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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

        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredConversations.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start a new chat to get going</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentChatId === conversation.id}
                      className="h-auto p-3"
                    >
                      <Link
                        href={`/chat/${conversation.id}`}
                        onMouseDown={() =>
                          handleConversationClick(conversation.id)
                        }
                      >
                        <div className="flex w-full min-w-0 flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium">
                              {conversation.title || "Untitled Chat"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs">
                              {formatDate(conversation.updated_at)}
                            </span>
                            {conversation.is_shared && (
                              <Badge variant="secondary" className="text-xs">
                                Shared
                              </Badge>
                            )}
                          </div>
                        </div>
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
                            {conversation.title || "Untitled Chat"}&rdquo;? This
                            action cannot be undone and will permanently remove
                            the conversation and all its messages.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            disabled={deletingId === conversation.id}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(conversation.id)}
                            disabled={deletingId === conversation.id}
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
                ))
              )}
            </SidebarMenu>
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
