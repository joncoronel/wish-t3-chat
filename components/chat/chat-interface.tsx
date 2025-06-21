"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useChat } from "ai/react";

import {
  useConversation,
  useMessages,
  useConversations,
} from "@/hooks/use-conversations";
import { useChatUrl } from "@/hooks/use-chat-url";
import { useChatLoading } from "@/hooks/use-chat-loading";
import { useGlobalModel } from "@/hooks/use-global-model";
import { useApiKeysUnified } from "@/hooks/use-api-keys-unified";
import { ChatWelcome } from "./chat-welcome";
import { ChatMessages } from "./chat-messages";

import { toast } from "sonner";
import { cn, generateConversationTitle } from "@/lib/utils";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import type { ChatAttachment } from "@/types";

// Helper function to convert database attachments to ChatAttachment format
function convertDbAttachmentsToChat(
  attachments: Record<string, unknown>[] | null,
): ChatAttachment[] | undefined {
  if (!attachments) return undefined;
  return attachments.map((att) => ({
    id: att.id as string,
    type: att.type as "image" | "document",
    name: att.name as string,
    url: att.url as string,
    size: att.size as number,
    mime_type: att.mime_type as string,
  }));
}

interface ChatInterfaceProps {
  className?: string;
  chatId?: string;
  userId?: string;
}

export function ChatInterface({
  className,
  chatId,
  userId,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { navigateToChat } = useChatUrl();
  const { setLoading } = useChatLoading();
  const { selectedModel } = useGlobalModel();

  const { apiKeys, isLoading: isLoadingApiKeys } = useApiKeysUnified({
    userId: userId || "",
  });

  // Debug component lifecycle - will be added after handleSendMessage

  const [selectedCategory, setSelectedCategory] = useState<
    "default" | "create" | "explore" | "code" | "learn"
  >("default");

  // Track the active conversation ID for new chats
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(chatId || null);

  // Current conversation ID for this chat session
  const currentConversationId = chatId || activeConversationId;

  // Create a stable key for the useChat hook to ensure proper isolation
  const chatKey = currentConversationId || "new-chat";

  // Welcome screen categories and prompts
  const categoryPrompts = {
    default: [
      "How does AI work?",
      "Are black holes real?",
      'How many Rs are in the word "strawberry"?',
      "What is the meaning of life?",
    ],
    create: [
      "Help me write a creative story",
      "Design a logo for my startup",
      "Create a workout plan for beginners",
      "Write a poem about nature",
    ],
    explore: [
      "What are the latest trends in AI?",
      "Explain quantum computing simply",
      "Tell me about ancient civilizations",
      "What's happening in space exploration?",
    ],
    code: [
      "Help me debug this JavaScript code",
      "Explain React hooks with examples",
      "How do I optimize database queries?",
      "Best practices for API design",
    ],
    learn: [
      "Teach me basic photography",
      "How does machine learning work?",
      "Explain the stock market basics",
      "What is blockchain technology?",
    ],
  } as const;

  // Use SWR to get conversation and messages (only when we have a chatId)
  const { isLoading: isLoadingConversation } = useConversation(
    chatId || "",
    userId || "",
  );
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(
    chatId || "",
  );

  // Get all conversations for welcome screen optimistic updates
  const { data: allConversations = [] } = useConversations(userId || "");

  // Ensure we sync the active conversation ID when the URL changes
  useEffect(() => {
    if (chatId !== activeConversationId) {
      setActiveConversationId(chatId || null);
    }
  }, [chatId, activeConversationId]);

  // Memoize apiKeys to prevent useChat from re-creating on every change
  const stableApiKeys = useMemo(() => {
    // Only update if the actual content changes, not the object reference
    return apiKeys;
  }, [JSON.stringify(apiKeys)]);

  // Only initialize useChat when API keys are ready to prevent race conditions
  const shouldInitializeChat = !isLoadingApiKeys;

  const {
    messages: chatMessages,
    append,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: shouldInitializeChat ? chatKey : `loading-${chatKey}`, // Use different key when not ready
    initialMessages: shouldInitializeChat
      ? messages.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          experimental_attachments: convertDbAttachmentsToChat(msg.attachments),
        }))
      : [],
    body: {
      model: selectedModel,
      temperature: 0.7,
      max_tokens: 2048,
      conversationId: currentConversationId,
      apiKeys: stableApiKeys,
    },

    onFinish: async () => {
      if (userId && currentConversationId) {
        // Clear loading state when AI response is complete
        setLoading(currentConversationId, false);

        // Only revalidate messages when AI response is complete
        // Don't revalidate conversations - our optimistic update should be enough
        mutate(`messages-${currentConversationId}`);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Failed to send message: " + error.message);

      // Clear loading state on error
      if (currentConversationId) {
        setLoading(currentConversationId, false);
      }
    },
  });

  // Sync database messages with chat messages when they change and chat is ready
  useEffect(() => {
    if (
      shouldInitializeChat &&
      messages.length > 0 &&
      chatMessages.length === 0
    ) {
      setMessages(
        messages.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          experimental_attachments: convertDbAttachmentsToChat(msg.attachments),
        })),
      );
    }
  }, [shouldInitializeChat, messages, chatMessages.length, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMessages]);

  // Create wrapper append function that always includes current API keys
  // const append = useCallback(
  //   async (
  //     message: Parameters<typeof originalAppend>[0],
  //     options?: Parameters<typeof originalAppend>[1],
  //   ) => {
  //     return originalAppend(message, {
  //       ...options,
  //       body: {
  //         ...options?.body,
  //         apiKeys: stableApiKeys, // Always include current API keys
  //       },
  //     });
  //   },
  //   [originalAppend, stableApiKeys],
  // );

  // Combined messages for display
  // Use chatMessages as the source of truth since we sync database messages into it
  const displayMessages = chatMessages;

  const handleSendMessage = useCallback(
    async (
      messageContent: string,
      attachments?: ChatAttachment[],
      fromPendingMessage = false,
    ) => {
      if (!userId) {
        toast.error("Please sign in to send messages");
        return;
      }

      // Wait for API keys to be loaded before sending message
      if (isLoadingApiKeys) {
        console.log("API keys still loading, please wait...");
        toast.info("Loading API keys, please wait...");
        return;
      }

      // Debug log current API keys
      console.log("Current API keys:", {
        hasKeys: Object.keys(stableApiKeys).length > 0,
        providers: Object.keys(stableApiKeys),
        selectedModel,
      });

      try {
        // If this is a new chat (no chatId)
        if (!chatId) {
          // If this is from a pending message, we should have a chatId from the query parameter
          if (fromPendingMessage && chatId) {
            setActiveConversationId(chatId);

            // Set loading state for pending message
            setLoading(chatId, true);

            // Send the message - the API will create the conversation if it doesn't exist
            await append(
              {
                role: "user",
                content: messageContent,
                experimental_attachments: attachments,
              },
              {
                body: {
                  attachments,
                },
              },
            );

            return;
          }

          // For welcome screen prompts, create new conversation optimistically
          const conversationId = uuidv4();

          // Set the active conversation ID for the useChat hook
          setActiveConversationId(conversationId);

          // Set loading state for new conversation
          setLoading(conversationId, true);

          // Optimistically add the conversation to the sidebar immediately
          const optimisticConversation = {
            id: conversationId,
            user_id: userId,
            title: generateConversationTitle(messageContent),
            model: selectedModel,
            system_prompt: null,
            is_shared: false,
            share_token: null,
            folder_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // For welcome screen prompts, we still need to do optimistic update
          // since they don't go through ChatInputWrapper
          // Use the same safe pattern as ChatInputWrapper
          mutate(
            `conversations-${userId}`,
            [optimisticConversation, ...allConversations],
            false, // Don't revalidate immediately
          );

          // Navigate to the new conversation
          navigateToChat(conversationId);

          // Store the message and attachments for when the component remounts
          sessionStorage.setItem(
            `pendingMessage-${conversationId}`,
            JSON.stringify({ message: messageContent, attachments }),
          );

          // Don't immediately revalidate - let the onFinish callback handle it
          // This prevents the optimistic update from being overwritten too quickly
        } else {
          // For existing chats, send the message and update cache immediately
          // Set loading state when sending message
          if (currentConversationId) {
            setLoading(currentConversationId, true);
          }

          // Optimistically update the conversation timestamp and sort
          if (currentConversationId) {
            const updatedConversations = allConversations
              .map((conv) =>
                conv.id === currentConversationId
                  ? { ...conv, updated_at: new Date().toISOString() }
                  : conv,
              )
              .sort(
                (a, b) =>
                  new Date(b.updated_at).getTime() -
                  new Date(a.updated_at).getTime(),
              );

            mutate(
              `conversations-${userId}`,
              append(
                {
                  role: "user",
                  content: messageContent,
                  experimental_attachments: attachments,
                },
                {
                  body: {
                    attachments,
                  },
                },
              ),
              {
                revalidate: true,
                optimisticData: updatedConversations,
                populateCache: false,
                rollbackOnError: true,
              },
            );
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
      }
    },
    [
      userId,
      chatId,
      append,
      navigateToChat,
      setActiveConversationId,
      isLoadingApiKeys,
      stableApiKeys,
      selectedModel,
    ],
  );

  // Handle pending messages and listen for chat events
  useEffect(() => {
    // Check for pending message from sessionStorage
    if (chatId) {
      const pendingData = sessionStorage.getItem(`pendingMessage-${chatId}`);
      if (pendingData) {
        sessionStorage.removeItem(`pendingMessage-${chatId}`);

        try {
          // Try to parse as JSON (new format with attachments)
          const parsed = JSON.parse(pendingData);
          setTimeout(() => {
            handleSendMessage(parsed.message, parsed.attachments, true);
          }, 100);
        } catch {
          // Fallback to old format (just string message)
          setTimeout(() => {
            handleSendMessage(pendingData, undefined, true);
          }, 100);
        }
      }
    }

    // Listen for messages from ChatInputWrapper for existing chats
    const handleChatMessage = (event: CustomEvent) => {
      const { chatId: eventChatId, message, attachments } = event.detail;
      if (eventChatId === chatId) {
        handleSendMessage(message, attachments);
      }
    };

    window.addEventListener(
      "chat-send-message",
      handleChatMessage as EventListener,
    );

    return () => {
      window.removeEventListener(
        "chat-send-message",
        handleChatMessage as EventListener,
      );
    };
  }, [chatId, handleSendMessage]);

  // Check if we're loading messages for a specific chat
  const isLoadingChatContent =
    chatId &&
    (isLoadingConversation || isLoadingMessages) &&
    chatMessages.length === 0;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Show welcome screen for new chats */}
      {!chatId && chatMessages.length === 0 ? (
        <ChatWelcome
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryPrompts={categoryPrompts}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <div className="min-h-0 flex-1">
          <ChatMessages
            displayMessages={displayMessages}
            chatId={chatId}
            isLoading={Boolean(isLoadingChatContent)}
            isStreaming={Boolean(
              isLoading &&
                displayMessages.length > 0 &&
                displayMessages[displayMessages.length - 1]?.role ===
                  "assistant",
            )}
            isWaitingForResponse={Boolean(isLoading)}
            selectedModel={selectedModel}
            messagesEndRef={messagesEndRef}
          />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 text-destructive absolute right-0 bottom-0 left-0 z-20 border-t p-4 text-sm">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
