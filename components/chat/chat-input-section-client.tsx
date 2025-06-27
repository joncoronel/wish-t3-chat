"use client";

import { ChatInputWrapper } from "@/components/chat/chat-input-wrapper";
import { BranchSelector } from "@/components/chat/branch-selector";
import { useChatUrl } from "@/hooks/use-chat-url";
import { mutate } from "swr";

interface ChatInputSectionClientProps {
  userId: string;
}

export function ChatInputSectionClient({
  userId,
}: ChatInputSectionClientProps) {
  const { chatId } = useChatUrl();

  const handleBranchChange = (branchName: string) => {
    if (chatId) {
      // Revalidate messages for the new branch
      mutate(`messages-${chatId}-${branchName}`);
    }
  };

  return (
    <div className="pointer-events-none p-4 pb-0">
      {/* Branch selector - only show when in a specific chat */}
      {chatId && (
        <div className="mb-2 flex justify-center">
          <div className="pointer-events-auto">
            <BranchSelector
              conversationId={chatId}
              className="max-w-xs"
              onBranchChange={handleBranchChange}
            />
          </div>
        </div>
      )}

      {/* Chat input */}
      <div className="pointer-events-none">
        <ChatInputWrapper userId={userId} />
      </div>
    </div>
  );
}
