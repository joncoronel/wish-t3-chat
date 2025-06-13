import { useEffect } from "react";
import { useAtom } from "jotai";
import { useAuth } from "./use-auth";
import { createClient } from "@/lib/supabase/client";
import {
  conversationsAtom,
  messagesAtom,
  activeConversationAtom,
  setActiveConversationAtom,
} from "@/store/chat";
import type { Conversation, Message } from "@/types";

export function useChatStorage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [activeConversation] = useAtom(activeConversationAtom);
  const [, setActiveConversation] = useAtom(setActiveConversationAtom);

  // Load conversations from database
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) {
        // Clear conversations when user is not authenticated
        setConversations([]);
        setActiveConversation(null);
        return;
      }

      try {
        const supabase = createClient();
        console.log("Loading conversations for user:", user.id);

        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error loading conversations:", error);
          return;
        }

        console.log("Loaded conversations:", data);
        setConversations(data || []);
      } catch (error) {
        console.error("Error in loadConversations:", error);
      }
    };

    loadConversations();
  }, [user, setConversations, setActiveConversation]);

  // Load messages for active conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!user || !activeConversation) {
        setMessages([]);
        return;
      }

      try {
        const supabase = createClient();
        console.log(
          "Loading messages for conversation:",
          activeConversation.id,
        );

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", activeConversation.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error loading messages:", error);
          return;
        }

        console.log("Loaded messages:", data);
        setMessages(data || []);
      } catch (error) {
        console.error("Error in loadMessages:", error);
      }
    };

    loadMessages();
  }, [user, activeConversation, setMessages]);

  // Save conversation to database
  const saveConversation = async (conversation: Conversation) => {
    if (!user) return;

    try {
      const supabase = createClient();
      console.log("Saving conversation:", conversation);

      const { error } = await supabase.from("conversations").upsert({
        ...conversation,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving conversation:", error);
        throw error;
      }

      // Update local state
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === conversation.id);
        if (index === -1) {
          return [conversation, ...prev];
        }
        const updated = [...prev];
        updated[index] = conversation;
        return updated;
      });
    } catch (error) {
      console.error("Error in saveConversation:", error);
      throw error;
    }
  };

  // Save message to database
  const saveMessage = async (message: Message) => {
    if (!user) return;

    try {
      const supabase = createClient();
      console.log("Saving message:", message);

      const { error } = await supabase.from("messages").insert({
        ...message,
        created_at: message.created_at || new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving message:", error);
        throw error;
      }

      // Update local state
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.error("Error in saveMessage:", error);
      throw error;
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      const supabase = createClient();
      console.log("Deleting conversation:", conversationId);

      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting conversation:", error);
        throw error;
      }

      // Update local state
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
    } catch (error) {
      console.error("Error in deleteConversation:", error);
      throw error;
    }
  };

  return {
    conversations,
    messages,
    saveConversation,
    saveMessage,
    deleteConversation,
  };
}
