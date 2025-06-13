"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { useConversation, useMessages } from "@/hooks/use-conversations";
import { useChatUrl } from "@/hooks/use-chat-url";
import { MessageComponent } from "./message";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";

import { Share, Settings, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { mutate } from "swr";

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
  const [selectedCategory, setSelectedCategory] = useState<
    keyof typeof categoryPrompts | "default"
  >("default");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");

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
    body: {
      model: "gpt-4", // TODO: Get from user settings
      temperature: 0.7,
      max_tokens: 2048,
      conversationId: chatId,
    },
    onFinish: async (message) => {
      console.log("Message finished:", message);

      if (userId) {
        // Always update the conversations cache to refresh the sidebar (for updated timestamps)
        mutate(`conversations-${userId}`, undefined, { revalidate: false });

        // If this was a new conversation (no chatId), we need to check if a conversation was created
        // The API will have created a conversation, so let's refresh the conversations and navigate
        if (!chatId) {
          // Wait a moment for the database to be updated, then fetch conversations
          setTimeout(async () => {
            // Trigger a refetch of conversations
            const conversations = await mutate(`conversations-${userId}`);
            if (conversations && conversations.length > 0) {
              // Navigate to the most recent conversation (first in the list due to ordering)
              const latestConversation = conversations[0];
              console.log(
                "Navigating to new conversation:",
                latestConversation.id,
              );
              navigateToChat(latestConversation.id);
            }
          }, 100); // Reduced timeout for faster navigation
        }
        // For existing chats, don't force a refetch - let SWR handle it naturally
        // The messages will be updated through the normal SWR revalidation cycle
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

  // Combined messages for display
  const displayMessages = conversation
    ? [
        ...messages, // All messages from database
        // Add any new messages from useChat that aren't saved yet
        ...chatMessages.filter((chatMsg) => {
          // Show user messages immediately (they won't be in DB yet)
          if (chatMsg.role === "user") {
            return !messages.some(
              (dbMsg) =>
                dbMsg.role === "user" && dbMsg.content === chatMsg.content,
            );
          }
          // Show assistant messages while streaming or if not in DB yet
          if (chatMsg.role === "assistant") {
            return !messages.some(
              (dbMsg) =>
                dbMsg.role === "assistant" && dbMsg.content === chatMsg.content,
            );
          }
          return false;
        }),
      ]
    : chatMessages;

  const handleSendMessage = async (messageContent: string) => {
    if (!userId) {
      toast.error("Please sign in to send messages");
      return;
    }

    console.log("Sending message:", messageContent);

    try {
      // Use the useChat hook's append method to send messages
      await append({
        role: "user",
        content: messageContent,
      });
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

  // Show loading state while loading conversation or messages (only if we have a chatId)
  if (chatId && (isLoadingConversation || isLoadingMessages)) {
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
