"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useChatUrl } from "@/hooks/use-chat-url";
import { cn } from "@/lib/utils";

interface NewChatButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function NewChatButton({
  className,
  variant = "default",
  size = "default",
}: NewChatButtonProps) {
  const { navigateToNewChat } = useChatUrl();

  const handleNewChat = () => {
    // Simply navigate to the new chat page
    navigateToNewChat();
  };

  return (
    <Button
      onClick={handleNewChat}
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
    >
      <Plus className="h-4 w-4" />
      New Chat
    </Button>
  );
}
