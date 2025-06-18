"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { AIResponse } from "@/components/chat/ai-response";

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
  const isSystem = message.role === "system";
  const isAssistant = message.role === "assistant";

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

  // AI Assistant messages - no bubble, no avatar
  if (isAssistant) {
    return (
      <div className={cn("group flex py-4", className)}>
        <div className="flex w-full flex-col">
          <div className="text-sm leading-relaxed">
            <AIResponse className="prose dark:prose-invert prose-sm">
              {message.content + (isStreaming ? " ●" : "")}
            </AIResponse>
          </div>

          {/* Bottom action buttons and timestamp */}
          <div className="mt-3 flex items-center gap-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="text-muted-foreground text-xs">
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleCopy}
                title="Copy message"
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                  onClick={() => onDelete(message.id)}
                  title="Delete message"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User messages - keep bubble, remove avatar
  return (
    <div className={cn("group flex justify-end gap-3 py-4", className)}>
      <div className="flex max-w-[70%] flex-col items-end">
        <Card
          className={cn(
            "bg-primary text-primary-foreground relative px-4 py-3",
            isStreaming && "animate-pulse",
          )}
        >
          <div className="text-sm leading-relaxed break-words">
            <div className="whitespace-pre-wrap">
              {message.content}
              {isStreaming && (
                <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
              )}
            </div>
          </div>
        </Card>

        {/* Bottom action buttons and timestamp */}
        <div className="mt-1 flex w-full items-center justify-between px-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCopy}
              title="Copy message"
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </Button>

            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onEdit(message.id)}
                title="Edit message"
              >
                <Edit2 className="mr-1 h-3 w-3" />
                Edit
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                onClick={() => onDelete(message.id)}
                title="Delete message"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>

          <div className="text-muted-foreground text-xs">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
