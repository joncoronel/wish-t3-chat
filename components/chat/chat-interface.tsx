"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "ai/react";

import {
  useConversation,
  useMessages,
  useConversations,
} from "@/hooks/use-conversations";
import { useChatUrl } from "@/hooks/use-chat-url";
import { useChatLoading } from "@/hooks/use-chat-loading";
import { ChatWelcome } from "./chat-welcome";
import { ChatMessages } from "./chat-messages";

import { toast } from "sonner";
import { cn, generateConversationTitle } from "@/lib/utils";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";

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

  // Debug component lifecycle - will be added after handleSendMessage

  const [selectedCategory, setSelectedCategory] = useState<
    keyof typeof categoryPrompts | "default"
  >("default");

  // Track the active conversation ID for new chats
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  // Current conversation ID for this chat session
  const currentConversationId = chatId || activeConversationId;

  // Define prompts for each category
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
  const { data: conversation, isLoading: isLoadingConversation } =
    useConversation(chatId || "", userId || "");
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(
    chatId || "",
  );

  // Get all conversations for welcome screen optimistic updates
  const { data: allConversations = [] } = useConversations(userId || "");

  const {
    messages: chatMessages,
    append,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: currentConversationId || "temp",
    initialMessages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    })),
    body: {
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 2048,
      conversationId: currentConversationId,
    },
    // onResponse: async (response) => {
    //   console.log("Response received:", response);
    //   if (userId && currentConversationId && response.ok) {
    //     // Update conversations cache immediately when API confirms message was saved
    //     mutate(`conversations-${userId}`);
    //   }
    // },

    onFinish: async (message) => {
      console.log("Message finished:", message);

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

  // Sync database messages with chat messages when they change
  useEffect(() => {
    if (messages.length > 0 && chatMessages.length === 0) {
      console.log("Syncing database messages to chat hook:", messages.length);
      setMessages(
        messages.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
      );
    }
  }, [messages, chatMessages.length, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMessages]);

  // Log when chatMessages change to track when they disappear
  useEffect(() => {
    console.log("ChatMessages changed:", {
      count: chatMessages.length,
      currentConversationId,
      chatId,
      activeConversationId,
      messages: chatMessages.map((m) => ({
        role: m.role,
        content: m.content.slice(0, 30),
      })),
    });
  }, [chatMessages, currentConversationId, chatId, activeConversationId]);

  // Combined messages for display
  // Use chatMessages as the source of truth since we sync database messages into it
  const displayMessages = chatMessages;

  // Debug logging for troubleshooting
  console.log("Chat state debug:", {
    chatId,
    activeConversationId,
    currentConversationId,
    conversation: !!conversation,
    messagesFromDB: messages.length,
    chatMessages: chatMessages.length,
    displayMessages: displayMessages.length,
    isLoadingConversation,
    isLoadingMessages,
    messagesDetails: messages.map((m) => ({
      role: m.role,
      content: m.content.slice(0, 50),
    })),
    chatMessagesDetails: chatMessages.map((m) => ({
      role: m.role,
      content: m.content.slice(0, 50),
    })),
  });

  const handleSendMessage = useCallback(
    async (messageContent: string, fromPendingMessage = false) => {
      if (!userId) {
        toast.error("Please sign in to send messages");
        return;
      }

      console.log(
        "Sending message:",
        messageContent,
        "fromPending:",
        fromPendingMessage,
      );

      try {
        // If this is a new chat (no chatId)
        if (!chatId) {
          console.log("Starting new conversation...");

          // If this is from a pending message, extract the conversation ID from URL and do optimistic update
          if (fromPendingMessage) {
            // Extract conversationId from the current URL since we're now on /chat/[id]
            const currentPath = window.location.pathname;
            const pathParts = currentPath.split("/");
            const urlConversationId = pathParts[pathParts.length - 1];

            if (urlConversationId && urlConversationId !== "chat") {
              setActiveConversationId(urlConversationId);

              // Set loading state for pending message
              setLoading(urlConversationId, true);

              // Send the message - the API will create the conversation if it doesn't exist
              await append({
                role: "user",
                content: messageContent,
              });
              return;
            }
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
            model: "gpt-4",
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

          // Store the message for when the component remounts (same as input wrapper)
          sessionStorage.setItem(
            `pendingMessage-${conversationId}`,
            messageContent,
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
              append({
                role: "user",
                content: messageContent,
              }),
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
    [userId, chatId, append, navigateToChat, setActiveConversationId],
  );

  // Debug component lifecycle and handle pending messages
  useEffect(() => {
    console.log("ChatInterface mounted with chatId:", chatId);

    // Check for pending message from sessionStorage
    if (chatId) {
      const pendingMessage = sessionStorage.getItem(`pendingMessage-${chatId}`);
      if (pendingMessage) {
        console.log("Found pending message:", pendingMessage);
        sessionStorage.removeItem(`pendingMessage-${chatId}`);

        // Send the pending message after a brief delay to ensure component is ready
        setTimeout(() => {
          handleSendMessage(pendingMessage, true);
        }, 100);
      }
    }

    // Listen for messages from ChatInputWrapper for existing chats
    const handleChatMessage = (event: CustomEvent) => {
      const { chatId: eventChatId, message } = event.detail;
      if (eventChatId === chatId) {
        console.log("Received message from input wrapper:", message);
        handleSendMessage(message);
      }
    };

    window.addEventListener(
      "chat-send-message",
      handleChatMessage as EventListener,
    );

    return () => {
      console.log("ChatInterface unmounting, chatId was:", chatId);
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
            isStreaming={Boolean(isLoading)}
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
