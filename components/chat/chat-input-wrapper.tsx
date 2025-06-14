"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ChatInput } from "./chat-input";
import { useChatUrl } from "@/hooks/use-chat-url";
import { useChatLoading } from "@/hooks/use-chat-loading";
import { useConversations } from "@/hooks/use-conversations";
import { generateConversationTitle } from "@/lib/utils";
import { toast } from "sonner";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import type { Conversation } from "@/types";

interface ChatInputWrapperProps {
  userId: string;
}

// Custom event for sending messages to existing chats
export const CHAT_MESSAGE_EVENT = "chat-send-message";

export interface ChatMessageEventDetail {
  chatId: string;
  message: string;
}

export function ChatInputWrapper({ userId }: ChatInputWrapperProps) {
  const params = useParams();
  const chatId = params?.id as string | undefined;
  const { navigateToChat } = useChatUrl();
  const { setLoading } = useChatLoading();
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");

  // Get current conversations for optimistic updates
  const { data: allConversations = [] } = useConversations(userId || "");

  const handleSendMessage = async (messageContent: string) => {
    if (!userId) {
      toast.error("Please sign in to send messages");
      return;
    }

    console.log("Sending message:", messageContent);

    try {
      // If this is a new chat (no chatId), generate conversation ID and navigate
      if (!chatId) {
        console.log("Starting new conversation...");

        const conversationId = uuidv4();

        // Optimistically add the conversation to the sidebar immediately
        const optimisticConversation: Conversation = {
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

        // Add to SWR cache optimistically with current conversations
        mutate(
          `conversations-${userId}`,
          [optimisticConversation, ...allConversations],
          false, // Don't revalidate immediately
        );

        // Set loading state for new conversation
        setLoading(conversationId, true);

        // Navigate to new conversation with the initial message
        navigateToChat(conversationId);

        // Store the message for the ChatInterface to pick up
        sessionStorage.setItem(
          `pendingMessage-${conversationId}`,
          messageContent,
        );
      } else {
        // For existing chats, dispatch a custom event for the ChatInterface to handle
        const event = new CustomEvent<ChatMessageEventDetail>(
          CHAT_MESSAGE_EVENT,
          {
            detail: { chatId, message: messageContent },
          },
        );
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  return (
    <ChatInput
      onSendMessage={handleSendMessage}
      disabled={!userId}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
    />
  );
}
