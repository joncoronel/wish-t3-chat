"use client";

import { MessageComponent } from "./message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { ShimmerText } from "@/components/ui/shimmer-text";
import { ScrollToBottomButton } from "./scroll-to-bottom-button";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { isThinkingModel } from "@/lib/ai";
import { useAtom } from "jotai";
import { getActiveBranchAtom } from "@/store/branch";
import type { Message } from "ai";
import type { Message as DBMessage } from "@/types";

interface ChatMessagesProps {
  displayMessages: (Message | DBMessage)[];
  chatId?: string;
  isLoading: boolean;
  isStreaming: boolean;
  isWaitingForResponse: boolean;
  selectedModel?: string;
}

export function ChatMessages({
  displayMessages,
  chatId,
  isLoading,
  isStreaming,
  isWaitingForResponse,
  selectedModel,
}: ChatMessagesProps) {
  // Get the active branch for this conversation
  const [activeBranch] = useAtom(getActiveBranchAtom(chatId || ""));

  // Ensure activeBranch is properly typed as string
  const branchName = typeof activeBranch === "string" ? activeBranch : "main";

  const {
    scrollAreaViewportRef,
    messagesEndRef,
    isNearBottom,
    isContentVisible,
    scrollToBottom,
  } = useChatScroll({
    messages: displayMessages,
    chatId,
    isStreaming,
    branchName,
  });

  // Show loading indicator when waiting for AI to start responding
  // This happens when: we're waiting for response AND the last message is from user
  const lastMessage = displayMessages[displayMessages.length - 1];
  const showLoadingIndicator =
    isWaitingForResponse &&
    lastMessage?.role === "user" &&
    displayMessages.length > 0;

  // Check if current model is a thinking model
  const isThinking = selectedModel ? isThinkingModel(selectedModel) : false;

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
    <div className="relative h-full">
      <ScrollArea className="h-full w-full" viewportRef={scrollAreaViewportRef}>
        <div className="flex justify-center">
          <div
            className={`w-full max-w-4xl space-y-4 p-4 pb-32 transition-opacity duration-100 ${
              isContentVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {displayMessages.map((message, index) => {
              // Handle both store messages and useChat messages
              const isDBMessage =
                "created_at" in message &&
                typeof message.created_at === "string";

              // Check for experimental_attachments from useChat hook
              const hasExperimentalAttachments =
                "experimental_attachments" in message &&
                message.experimental_attachments;

              // Check for createdAt from useChat messages
              const hasCreatedAt = "createdAt" in message && message.createdAt;

              return (
                <MessageComponent
                  key={message.id}
                  conversationId={chatId || ""}
                  message={{
                    id: message.id,
                    conversation_id: chatId || "",
                    role: message.role as "user" | "assistant" | "system",
                    content: message.content,
                    created_at: isDBMessage
                      ? (message as DBMessage).created_at
                      : hasCreatedAt
                      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (message as any).createdAt instanceof Date
                        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (message as any).createdAt.toISOString()
                        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (message as any).createdAt
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
                    // Add experimental_attachments for useChat messages
                    experimental_attachments: hasExperimentalAttachments
                      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (message as any).experimental_attachments
                      : undefined,
                  }}
                  isStreaming={
                    isStreaming &&
                    index === displayMessages.length - 1 &&
                    message.role === "assistant"
                  }
                  isDBMessage={isDBMessage}
                  messageIndex={index}
                />
              );
            })}

            {/* Show loading indicator when waiting for AI response */}
            {showLoadingIndicator && (
              <div className="mb-8 flex py-4">
                <div className="flex w-full flex-col">
                  <div className="text-sm leading-relaxed">
                    {isThinking ? (
                      <div className="flex items-center gap-2">
                        <ShimmerText className="text-sm">
                          AI is thinking...
                        </ShimmerText>
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex items-center">
                        <Spinner variant="ellipsis" size={20} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Scroll to bottom button - positioned above the chat input area */}
      <ScrollToBottomButton
        isVisible={!isNearBottom && displayMessages.length > 0}
        onClick={scrollToBottom}
      />
    </div>
  );
}
