"use client";

import { useAtom } from "jotai";
import { useState } from "react";
import { MessageSquare, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  sidebarOpenAtom,
  conversationsAtom,
  activeConversationAtom,
  setActiveConversationAtom,
  isNewChatModalOpenAtom,
} from "@/store";
import type { Conversation } from "@/types";

export function Sidebar() {
  const [sidebarOpen] = useAtom(sidebarOpenAtom);
  const [conversations] = useAtom(conversationsAtom);
  const [activeConversation] = useAtom(activeConversationAtom);
  const [, setActiveConversation] = useAtom(setActiveConversationAtom);
  const [, setNewChatModalOpen] = useAtom(isNewChatModalOpenAtom);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.model.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  const handleNewChat = () => {
    setNewChatModalOpen(true);
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

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="bg-background/95 supports-[backdrop-filter]:bg-background/60 w-64 border-r backdrop-blur">
      <div className="flex h-full flex-col">
        {/* New Chat Button */}
        <div className="border-b p-4">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="p-4">
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
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new chat to get going</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <Button
                  key={conversation.id}
                  variant={
                    activeConversation?.id === conversation.id
                      ? "secondary"
                      : "ghost"
                  }
                  className={cn(
                    "h-auto w-full justify-start p-3 text-left",
                    activeConversation?.id === conversation.id &&
                      "bg-secondary",
                  )}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="flex w-full min-w-0 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {conversation.title || "Untitled Chat"}
                      </span>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {conversation.model}
                      </Badge>
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
              ))
            )}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="border-t p-4">
          <div className="text-muted-foreground text-center text-xs">
            <p>Built with ❤️ for T3 Chat Clone</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
