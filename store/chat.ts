import { atom } from "jotai";
import type { Conversation, Message, ChatSettings } from "@/types";

// Chat state atoms
export const activeConversationAtom = atom<Conversation | null>(null);
export const conversationsAtom = atom<Conversation[]>([]);
export const messagesAtom = atom<Message[]>([]);
export const isStreamingAtom = atom<boolean>(false);
export const isLoadingAtom = atom<boolean>(false);

// Chat settings
export const chatSettingsAtom = atom<ChatSettings>({
  model: "gpt-4",
  temperature: 0.7,
  max_tokens: 2048,
});

// UI state
export const selectedMessageIdAtom = atom<string | null>(null);
export const isComposingAtom = atom<boolean>(false);

// Derived atoms
export const activeConversationIdAtom = atom(
  (get) => get(activeConversationAtom)?.id ?? null,
);

export const activeConversationMessagesAtom = atom((get) => {
  const activeConversationId = get(activeConversationIdAtom);
  const messages = get(messagesAtom);

  if (!activeConversationId) return [];

  // Filter messages for the active conversation
  const filteredMessages = messages
    .filter((message) => message.conversation_id === activeConversationId)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  return filteredMessages;
});

export const hasActiveConversationAtom = atom(
  (get) => get(activeConversationAtom) !== null,
);

// Actions
export const setActiveConversationAtom = atom(
  null,
  (get, set, conversation: Conversation | null) => {
    set(activeConversationAtom, conversation);
    // Only clear messages when explicitly going to new chat (null conversation)
    if (conversation === null) {
      set(messagesAtom, []);
    }
  },
);

export const addMessageAtom = atom(null, (get, set, message: Message) => {
  const currentMessages = get(messagesAtom);
  set(messagesAtom, [...currentMessages, message]);
});

export const updateMessageAtom = atom(
  null,
  (get, set, messageId: string, updates: Partial<Message>) => {
    const currentMessages = get(messagesAtom);
    set(
      messagesAtom,
      currentMessages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg,
      ),
    );
  },
);

export const setMessagesAtom = atom(null, (get, set, messages: Message[]) => {
  set(messagesAtom, messages);
});

export const addConversationAtom = atom(
  null,
  (get, set, conversation: Conversation) => {
    const currentConversations = get(conversationsAtom);
    set(conversationsAtom, [conversation, ...currentConversations]);
  },
);

export const updateConversationAtom = atom(
  null,
  (get, set, conversationId: string, updates: Partial<Conversation>) => {
    const currentConversations = get(conversationsAtom);
    set(
      conversationsAtom,
      currentConversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv,
      ),
    );
  },
);

export const setChatSettingsAtom = atom(
  null,
  (get, set, settings: Partial<ChatSettings>) => {
    const currentSettings = get(chatSettingsAtom);
    set(chatSettingsAtom, { ...currentSettings, ...settings });
  },
);

export const setActiveConversationWithMessagesAtom = atom(
  null,
  (get, set, conversation: Conversation | null, messages: Message[] = []) => {
    if (conversation) {
      // When switching to a specific conversation, replace all messages with the new ones
      // This prevents showing old messages from other conversations
      set(messagesAtom, messages);
      set(activeConversationAtom, conversation);
    } else {
      // When clearing conversation (new chat), clear all messages
      set(messagesAtom, []);
      set(activeConversationAtom, null);
    }
  },
);
