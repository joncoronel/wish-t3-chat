"use client";

import { ChatInputWrapper } from "@/components/chat/chat-input-wrapper";

interface ChatInputSectionClientProps {
  userId: string;
}

export function ChatInputSectionClient({
  userId,
}: ChatInputSectionClientProps) {
  return (
    <div className="pointer-events-none p-4 pb-0">
      {/* Chat input */}
      <div className="pointer-events-none">
        <ChatInputWrapper userId={userId} />
      </div>
    </div>
  );
}
