"use client";

import { memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, User, Bot, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";

interface MessageComponentProps {
  message: Message;
  isStreaming?: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  className?: string;
}

export const MessageComponent = memo(function MessageComponent({
  message,
  isStreaming = false,
  onEdit,
  onDelete,
  className,
}: MessageComponentProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Message copied to clipboard");
    } catch {
      toast.error("Failed to copy message");
    }
  };

  if (isSystem) {
    return (
      <div className={cn("flex justify-center py-2", className)}>
        <div className="bg-muted text-muted-foreground rounded-lg px-3 py-1 text-sm">
          System: {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex gap-3 py-4",
        isUser ? "justify-end" : "justify-start",
        className,
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex max-w-[70%] flex-col",
          isUser ? "items-end" : "items-start",
        )}
      >
        <Card
          className={cn(
            "relative px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted border-border",
            isStreaming && "animate-pulse",
          )}
        >
          <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
            {isStreaming && (
              <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
            )}
          </div>

          {/* Action buttons - show on hover */}
          <div
            className={cn(
              "absolute -top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100",
              isUser ? "-left-16" : "-right-16",
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleCopy}
              title="Copy message"
            >
              <Copy className="h-3 w-3" />
            </Button>

            {isUser && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onEdit(message.id)}
                title="Edit message"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                onClick={() => onDelete(message.id)}
                title="Delete message"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </Card>

        {/* Timestamp */}
        <div
          className={cn(
            "text-muted-foreground mt-1 px-1 text-xs",
            isUser ? "text-right" : "text-left",
          )}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
