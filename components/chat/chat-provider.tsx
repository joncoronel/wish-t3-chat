"use client";

import { useChatStorage } from "@/hooks/use-chat-storage";

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  // Initialize chat storage
  useChatStorage();

  return <>{children}</>;
}
