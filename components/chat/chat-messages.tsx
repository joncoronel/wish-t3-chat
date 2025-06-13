"use client";

import { MessageComponent } from "./message";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "ai";
import type { Message as DBMessage } from "@/types";

interface ChatMessagesProps {
  displayMessages: (Message | DBMessage)[];
  chatId?: string;
  isLoading: boolean;
  isStreaming: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  displayMessages,
  chatId,
  isLoading,
  isStreaming,
  messagesEndRef,
}: ChatMessagesProps) {
  // Show loading state when switching chats
  if (isLoading) {
    return (
      <ScrollArea className="h-full w-full">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl space-y-4 p-4 pb-32">
            {/* Skeleton messages for loading state */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 py-4">
                <div className="bg-muted h-8 w-8 animate-pulse rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-4 w-3/4 animate-pulse rounded"></div>
                  <div className="bg-muted h-4 w-1/2 animate-pulse rounded"></div>
                  {i === 1 && (
                    <div className="bg-muted h-4 w-2/3 animate-pulse rounded"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex justify-center">
        <div className="w-full max-w-4xl space-y-4 p-4 pb-32">
          {displayMessages.map((message, index) => {
            // Handle both store messages and useChat messages
            const isDBMessage =
              "created_at" in message && typeof message.created_at === "string";

            return (
              <MessageComponent
                key={message.id}
                message={{
                  id: message.id,
                  conversation_id: chatId || "",
                  role: message.role as "user" | "assistant" | "system",
                  content: message.content,
                  created_at: isDBMessage
                    ? (message as DBMessage).created_at
                    : new Date().toISOString(),
                  metadata: isDBMessage
                    ? (message as DBMessage).metadata
                    : null,
                  parent_id: isDBMessage
                    ? (message as DBMessage).parent_id
                    : null,
                  is_active: isDBMessage
                    ? (message as DBMessage).is_active
                    : true,
                  attachments: isDBMessage
                    ? (message as DBMessage).attachments
                    : null,
                }}
                isStreaming={
                  isStreaming && index === displayMessages.length - 1
                }
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </ScrollArea>
  );
}
