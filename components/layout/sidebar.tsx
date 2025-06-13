"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { useChatUrl } from "@/hooks/use-chat-url";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NewChatButton } from "@/components/chat/new-chat-button";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";
import { DeleteConversationDialog } from "@/components/chat/delete-conversation-dialog";

interface SidebarProps {
  userId: string;
}

export function Sidebar({ userId }: SidebarProps) {
  const { navigateToChat } = useChatUrl();
  const pathname = usePathname();
  const { data: conversations = [] } = useConversations(userId);
  const [searchQuery, setSearchQuery] = useState("");

  // Extract chat ID from URL path
  const currentChatId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.model.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectConversation = (conversation: Conversation) => {
    // Don't set active conversation here - let ChatInterface handle it based on URL
    navigateToChat(conversation.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <aside className="bg-background/95 supports-[backdrop-filter]:bg-background/60 w-64 flex-shrink-0 border-r backdrop-blur">
      <div className="flex h-full flex-col">
        {/* New Chat Button */}
        <div className="flex-shrink-0 border-b p-4">
          <NewChatButton
            variant="default"
            size="sm"
            className="w-full justify-start"
          />
        </div>

        {/* Search */}
        <div className="flex-shrink-0 p-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto px-4">
          <div className="space-y-1 pb-4">
            {filteredConversations.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new chat to get going</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div key={conversation.id} className="group relative">
                  <Button
                    variant={
                      currentChatId === conversation.id ? "secondary" : "ghost"
                    }
                    className={cn(
                      "h-auto w-full justify-start p-3 pr-12 text-left",
                      currentChatId === conversation.id && "bg-secondary",
                    )}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="flex w-full min-w-0 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {conversation.title || "Untitled Chat"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">
                          {formatDate(conversation.created_at)}
                        </span>
                        {conversation.is_shared && (
                          <Badge variant="secondary" className="text-xs">
                            Shared
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>

                  {/* Delete button - appears on hover */}
                  <div className="absolute top-1/2 right-2 -translate-y-1/2">
                    <DeleteConversationDialog
                      conversationId={conversation.id}
                      conversationTitle={conversation.title || "Untitled Chat"}
                      userId={userId}
                      currentChatId={currentChatId}
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex-shrink-0 border-t p-4">
          <div className="text-muted-foreground text-center text-xs">
            <p>Built with ❤️ for T3 Chat Clone</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
