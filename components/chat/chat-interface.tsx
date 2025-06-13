"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { useConversation, useMessages } from "@/hooks/use-conversations";
import { useChatUrl } from "@/hooks/use-chat-url";
import { createClient } from "@/lib/supabase/client";
import { MessageComponent } from "./message";
import { ChatInput } from "./chat-input";

// Fetch conversations function for optimistic updates
async function fetchConversations(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
import { Button } from "@/components/ui/button";

import { Share, Settings, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import type { Conversation } from "@/types";

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

  // Debug component lifecycle
  useEffect(() => {
    console.log("ChatInterface mounted with chatId:", chatId);
    return () => {
      console.log("ChatInterface unmounting, chatId was:", chatId);
    };
  }, [chatId]);
  const [selectedCategory, setSelectedCategory] = useState<
    keyof typeof categoryPrompts | "default"
  >("default");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");

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

  const {
    messages: chatMessages,
    append,
    isLoading,
    error,
    stop,
  } = useChat({
    api: "/api/chat",
    id: currentConversationId || "temp",
    body: {
      model: selectedModel,
      temperature: 0.7,
      max_tokens: 2048,
      conversationId: currentConversationId,
    },
    onFinish: async (message) => {
      console.log("Message finished:", message);

      if (userId && currentConversationId) {
        // Update the specific conversation's timestamp optimistically to avoid flash
        mutate(
          `conversations-${userId}`,
          (currentConversations: Conversation[] = []) => {
            console.log("Updating conversation timestamp after AI response");
            return currentConversations.map((conv) =>
              conv.id === currentConversationId
                ? { ...conv, updated_at: new Date().toISOString() }
                : conv,
            );
          },
          {
            revalidate: false, // Don't revalidate immediately to prevent flash
            populateCache: true, // Keep the optimistic data
          },
        );

        // Do a silent background revalidation to sync with server
        // This will merge with our optimistic data without causing visual flash
        mutate(`conversations-${userId}`);

        // Refresh messages cache for the current conversation
        mutate(`messages-${currentConversationId}`, undefined, {
          revalidate: true,
        });
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Failed to send message: " + error.message);
    },
  });

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
  // Prioritize live messages from useChat over database messages for better real-time experience
  const displayMessages =
    chatMessages.length > 0
      ? chatMessages // Show live streaming messages when available
      : messages; // Fall back to database messages when no live messages

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

  const handleSendMessage = async (messageContent: string) => {
    if (!userId) {
      toast.error("Please sign in to send messages");
      return;
    }

    console.log("Sending message:", messageContent);

    try {
      // If this is a new chat (no chatId), generate conversation ID but don't navigate yet
      if (!chatId) {
        console.log("Starting new conversation...");

        const conversationId = uuidv4();

        // Set the active conversation ID for the useChat hook
        setActiveConversationId(conversationId);

        // Optimistically add the conversation to the sidebar immediately
        const optimisticConversation = {
          id: conversationId,
          user_id: userId,
          title:
            messageContent.slice(0, 50) +
            (messageContent.length > 50 ? "..." : ""),
          model: selectedModel,
          system_prompt: null,
          is_shared: false,
          share_token: null,
          folder_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Optimistically update the conversations cache
        mutate(
          `conversations-${userId}`,
          async (
            currentConversations: Array<typeof optimisticConversation> = [],
          ) => {
            console.log(
              "Optimistic update - current conversations:",
              currentConversations.length,
              currentConversations.map((c) => ({
                id: c.id,
                title: c.title.slice(0, 30),
              })),
            );

            // If we don't have current conversations in cache, fetch them first
            if (currentConversations.length === 0) {
              console.log("No conversations in cache, fetching fresh data...");
              try {
                const freshConversations = await fetchConversations(userId);
                console.log(
                  "Fetched fresh conversations:",
                  freshConversations.length,
                );
                const newList = [optimisticConversation, ...freshConversations];
                console.log("Merged with fresh data, total:", newList.length);
                return newList;
              } catch (error) {
                console.error("Failed to fetch fresh conversations:", error);
                // Fall back to just the optimistic conversation
                return [optimisticConversation];
              }
            }

            // Only add if this conversation doesn't already exist
            const existingIndex = currentConversations.findIndex(
              (conv) => conv.id === conversationId,
            );
            if (existingIndex === -1) {
              const newList = [optimisticConversation, ...currentConversations];
              console.log(
                "Adding new conversation, total:",
                newList.length,
                newList.map((c) => ({ id: c.id, title: c.title.slice(0, 30) })),
              );
              return newList;
            }
            console.log("Conversation already exists, keeping current list");
            return currentConversations;
          },
          false, // Don't revalidate immediately
        );

        // Navigate immediately to show the URL change
        navigateToChat(conversationId);

        // Send the message - the API will create the conversation if it doesn't exist
        await append({
          role: "user",
          content: messageContent,
        });

        // Don't immediately revalidate - let the onFinish callback handle it
        // This prevents the optimistic update from being overwritten too quickly
      } else {
        // For existing chats, just send the message normally
        await append({
          role: "user",
          content: messageContent,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleStopStreaming = () => {
    stop();
  };

  const handleShare = () => {
    toast.info("Sharing feature coming soon!");
  };

  const handleSettings = () => {
    toast.info("Settings panel coming soon!");
  };

  // Show loading state while loading conversation or messages, but only if we don't have any chat messages yet
  // This allows new conversations to show immediately while they're being created
  if (
    chatId &&
    (isLoadingConversation || isLoadingMessages) &&
    chatMessages.length === 0
  ) {
    return (
      <div className={cn("flex h-full items-center justify-center", className)}>
        <div className="text-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground mt-2 text-sm">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  // Show welcome state immediately if no chatId AND no messages have been sent yet
  if (!chatId && chatMessages.length === 0) {
    return (
      <div className={cn("relative flex h-full flex-col", className)}>
        <div className="flex h-16 flex-shrink-0 items-center justify-end border-b px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSettings}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-8 pb-32">
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-foreground mb-8 text-3xl font-semibold">
              How can I help you today?
            </h1>

            {/* Category buttons */}
            <div className="mb-12 flex flex-wrap justify-center gap-3">
              <Button
                variant={selectedCategory === "create" ? "default" : "outline"}
                className="flex items-center gap-2 px-4 py-2"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === "create" ? "default" : "create",
                  )
                }
              >
                <span className="text-lg">⚡</span>
                Create
              </Button>
              <Button
                variant={selectedCategory === "explore" ? "default" : "outline"}
                className="flex items-center gap-2 px-4 py-2"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === "explore" ? "default" : "explore",
                  )
                }
              >
                <span className="text-lg">📚</span>
                Explore
              </Button>
              <Button
                variant={selectedCategory === "code" ? "default" : "outline"}
                className="flex items-center gap-2 px-4 py-2"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === "code" ? "default" : "code",
                  )
                }
              >
                <span className="text-lg">💻</span>
                Code
              </Button>
              <Button
                variant={selectedCategory === "learn" ? "default" : "outline"}
                className="flex items-center gap-2 px-4 py-2"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === "learn" ? "default" : "learn",
                  )
                }
              >
                <span className="text-lg">🎓</span>
                Learn
              </Button>
            </div>

            {/* Suggested prompts */}
            <div className="space-y-3">
              {categoryPrompts[selectedCategory].map((prompt) => (
                <Button
                  key={prompt}
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground w-full justify-start text-left"
                  onClick={() => handleSendMessage(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Input at bottom */}
        <div className="absolute right-0 bottom-0 left-0 z-10">
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder="Type your message here..."
            disabled={!userId || isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex h-16 flex-shrink-0 items-center justify-end border-b px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSettings}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="space-y-4 p-4 pb-40">
          {displayMessages.map((message, index) => {
            // Handle both store messages and useChat messages
            const isStoreMessage = "created_at" in message;

            return (
              <MessageComponent
                key={message.id}
                message={{
                  id: message.id,
                  conversation_id: chatId || "",
                  role: message.role as "user" | "assistant" | "system",
                  content: message.content,
                  created_at: isStoreMessage
                    ? message.created_at
                    : new Date().toISOString(),
                  metadata: isStoreMessage ? message.metadata : null,
                  parent_id: isStoreMessage ? message.parent_id : null,
                  is_active: isStoreMessage ? message.is_active : true,
                  attachments: isStoreMessage ? message.attachments : null,
                }}
                isStreaming={isLoading && index === displayMessages.length - 1}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="absolute right-0 bottom-0 left-0 z-10">
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isLoading}
          disabled={!userId || isLoading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 text-destructive absolute right-0 bottom-0 left-0 z-20 border-t p-4 text-sm">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
